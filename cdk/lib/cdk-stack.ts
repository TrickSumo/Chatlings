import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Table, AttributeType, BillingMode, StreamViewType } from 'aws-cdk-lib/aws-dynamodb';
import { Bucket, HttpMethods, EventType } from 'aws-cdk-lib/aws-s3';
import { UserPool, UserPoolClient, UserPoolDomain, OAuthScope } from 'aws-cdk-lib/aws-cognito';
import { PublicKey, KeyGroup } from 'aws-cdk-lib/aws-cloudfront';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource, S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createLambdas } from './lambdas';
import { createWebSocketApi } from './websocket-api';
import { createRestApi } from './rest-api';
import { createCloudFront } from './cloudfront';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DB For Messages, Groups and Conection data
    const dynamoDbTable = new Table(this, 'ChatlingsTable', {
      tableName: 'chatlings',
      partitionKey: { name: 'PK', type: AttributeType.STRING },
      sortKey: { name: 'SK', type: AttributeType.STRING },
      stream: StreamViewType.NEW_IMAGE,
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Media Files S3 bucket
    const mediaBucket = new Bucket(this, 'ChatlingsMediaBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [HttpMethods.PUT],
          allowedOrigins: ['*'],         // tighten to CloudFront domain after deploy
          allowedHeaders: ['*'],
        }
      ]
    });

    // Key for Cloudfront signed cookies
    const publicKey = new PublicKey(this, 'ChatlingsPublicKey', {
      encodedKey: readFileSync(join(__dirname, '../../keys/public_key.pem'), 'utf8'),
    });

    const keyGroup = new KeyGroup(this, 'ChatlingsKeyGroup', {
      items: [publicKey],
    });

    // Cognito for user management
    const userPool = new UserPool(this, 'ChatlingsUserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Cognito hosted UI domain (needed for sign-in redirect and logout)
    // prefix uses account ID to ensure global uniqueness
    const userPoolDomain = new UserPoolDomain(this, 'ChatlingsUserPoolDomain', {
      userPool,
      cognitoDomain: { domainPrefix: `chatlings-${this.account}` },
    });

    // Lambda functions + IAM permissions
    const lambdas = createLambdas(this, {
      table: dynamoDbTable,
      bucket: mediaBucket,
      userPool,
    });

    // Lambda Event Sources
    // DynamoDB Stream → MessageAnalyzer (AI moderation + broadcast on every new message)
    lambdas.messageAnalyzerFn.addEventSource(new DynamoEventSource(dynamoDbTable, {
      startingPosition: StartingPosition.LATEST,
      batchSize: 1,
    }));

    // S3 PUT → ImageAnalyzer (Rekognition moderation on every uploaded image)
    lambdas.imageAnalyzerFn.addEventSource(new S3EventSource(mediaBucket, {
      events: [EventType.OBJECT_CREATED_PUT],
      filters: [{ prefix: 'media/' }],
    }));

    // WebSocket API
    const { callbackUrl, wsApiDomain } = createWebSocketApi(this, {
      authorizerFn:  lambdas.authorizerFn,
      connectFn:     lambdas.connectFn,
      disconnectFn:  lambdas.disconnectFn,
      defaultFn:     lambdas.defaultFn,
      sendMessageFn: lambdas.sendMessageFn,
      createGroupFn: lambdas.createGroupFn,
      joinGroupFn:   lambdas.joinGroupFn,
      listGroupsFn:  lambdas.listGroupsFn,
      fetchHistoryFn: lambdas.fetchHistoryFn,
      askBotFn:      lambdas.askBotFn,
      preSignedUrlFn: lambdas.preSignedUrlFn,
    });

    // Wire WebSocket callback URL into MessageAnalyzer now that the API exists
    lambdas.messageAnalyzerFn.addEnvironment('WEBSOCKET_ENDPOINT', callbackUrl);

    //  HTTP API (signed cookies endpoint)
    const { apiDomain: httpApiDomain } = createRestApi(this, {
      generateSignedCookiesFn: lambdas.generateSignedCookiesFn,
    });

    // Step 10 — CloudFront distribution
    const { domainName, keyPairId } = createCloudFront(this, {
      mediaBucket,
      httpApiDomain,
      wsApiDomain,
      keyGroup,
      publicKey,
    });

    // Wire CloudFront domain + key pair ID into GenerateSignedCookies now that distribution exists
    lambdas.generateSignedCookiesFn.addEnvironment('cloudfrontDistributionDomain', `https://${domainName}`);
    lambdas.generateSignedCookiesFn.addEnvironment('keyPairId', keyPairId);

    // UserPoolClient created after CloudFront so the real domain can be set as callbackUrl
    const userPoolClient = new UserPoolClient(this, 'ChatlingsUserPoolClient', {
      userPool,
      generateSecret: false,
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [OAuthScope.EMAIL, OAuthScope.OPENID, OAuthScope.PHONE],
        callbackUrls: [`https://${domainName}/auth`],
        logoutUrls: [`https://${domainName}`],
      },
    });

    // Outputs consumed by deploy.sh to generate Frontend/.env
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, 'CognitoAuthority', {
      value: `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
    });
    new cdk.CfnOutput(this, 'CognitoUserPoolDomain', {
      value: `https://${userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com`,
    });

  }


}
