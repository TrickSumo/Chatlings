import { Stack } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { readFileSync } from 'fs';
import { join } from 'path';

interface LambdaProps {
  table: Table;
  bucket: Bucket;
  userPool: UserPool;
}

// projectRoot must be a common ancestor of both cdk/ and Lambda/
// Chatlings/ root satisfies this — esbuild is installed here
const projectRoot = join(__dirname, '../..');
const depsLockFilePath = join(__dirname, '../../package-lock.json');
const runtime = Runtime.NODEJS_20_X;

const bundling = {
  externalModules: ['@aws-sdk/*'], // already available in Lambda Node.js 20 runtime
};

// builds absolute entry path for each Lambda
const entry = (name: string) => join(__dirname, '../../Lambda', name, 'index.mjs');

// shared base props applied to every NodejsFunction
const base = { runtime, projectRoot, depsLockFilePath, bundling };

export function createLambdas(stack: Stack, props: LambdaProps) {
  const { table, bucket, userPool } = props;
  const commonEnv = { tableName: table.tableName };

  // 1. Authorizer — validates JWT from Cognito on every WebSocket connect
  // jsonwebtoken is bundled by esbuild (not in Lambda runtime)
  const authorizerFn = new NodejsFunction(stack, 'AuthorizerFn', {
    ...base,
    entry: entry('Authorizer'),
    environment: {
      userPoolId: userPool.userPoolId,
      region: stack.region,
    },
  });

  // 2. Connect — stores connectionId in DynamoDB on WebSocket connect
  const connectFn = new NodejsFunction(stack, 'ConnectFn', {
    ...base,
    entry: entry('Connect'),
    environment: commonEnv,
  });
  table.grantReadWriteData(connectFn);

  // 3. Disconnect — removes connectionId from DynamoDB on WebSocket disconnect
  const disconnectFn = new NodejsFunction(stack, 'DisconnectFn', {
    ...base,
    entry: entry('Disconnect'),
    environment: commonEnv,
  });
  table.grantReadWriteData(disconnectFn);

  // 4. Default — handles ping/pong heartbeat
  const defaultFn = new NodejsFunction(stack, 'DefaultFn', {
    ...base,
    entry: entry('Default'),
  });

  // 5. SendMessage — validates membership, stores message, triggers DynamoDB Stream
  const sendMessageFn = new NodejsFunction(stack, 'SendMessageFn', {
    ...base,
    entry: entry('SendMessage'),
    environment: commonEnv,
  });
  table.grantReadWriteData(sendMessageFn);

  // 6. CreateGroup — atomic TransactWrite to create group + membership records
  const createGroupFn = new NodejsFunction(stack, 'CreateGroupFn', {
    ...base,
    entry: entry('CreateGroup'),
    environment: commonEnv,
  });
  table.grantReadWriteData(createGroupFn);

  // 7. JoinGroup — validates group code, creates bidirectional membership records
  const joinGroupFn = new NodejsFunction(stack, 'JoinGroupFn', {
    ...base,
    entry: entry('JoinGroup'),
    environment: commonEnv,
  });
  table.grantReadWriteData(joinGroupFn);

  // 8. ListGroupsForUser — Query + BatchGet to return user's groups with metadata
  const listGroupsFn = new NodejsFunction(stack, 'ListGroupsForUserFn', {
    ...base,
    entry: entry('ListGroupsForUser'),
    environment: commonEnv,
  });
  table.grantReadData(listGroupsFn);

  // 9. FetchGroupChatHistory — returns latest 60 messages for a group
  const fetchHistoryFn = new NodejsFunction(stack, 'FetchGroupChatHistoryFn', {
    ...base,
    entry: entry('FetchGroupChatHistory'),
    environment: commonEnv,
  });
  table.grantReadData(fetchHistoryFn);

  // 10. AskBot — Bedrock Nova Micro responds to @askbot messages
  const askBotFn = new NodejsFunction(stack, 'AskBotFn', {
    ...base,
    entry: entry('AskBot'),
    environment: { ...commonEnv, modelId: 'amazon.nova-micro-v1:0', region: stack.region },
  });
  table.grantReadWriteData(askBotFn);
  askBotFn.addToRolePolicy(new PolicyStatement({
    actions: ['bedrock:InvokeModel'],
    resources: ['*'],
  }));

  // 11. GenerateS3PreSignedURL — returns signed PUT URL for direct browser→S3 upload
  const preSignedUrlFn = new NodejsFunction(stack, 'GenerateS3PreSignedURLFn', {
    ...base,
    entry: entry('GenerateS3PreSignedURL'),
    environment: { ...commonEnv, bucketName: bucket.bucketName },
  });
  table.grantReadData(preSignedUrlFn);
  bucket.grantPut(preSignedUrlFn);

  // 12. GenerateSignedCookies — issues 24hr CloudFront signed cookies for media access
  // externalModules is empty — @aws-sdk/cloudfront-signer is NOT in the Lambda runtime
  // cloudfrontDistributionDomain and keyPairId wired in Step 10 after CloudFront is created
  const generateSignedCookiesFn = new NodejsFunction(stack, 'GenerateSignedCookiesFn', {
    ...base,
    entry: entry('GenerateSignedCookies'),
    bundling: { externalModules: [] },
    environment: {
      privateKey: readFileSync(join(__dirname, '../../keys/private_key.pem'), 'utf8').replace(/\n/g, '\\n'),
      keyPairId: '',                    // TODO: wire in Step 10
      cloudfrontDistributionDomain: '', // TODO: wire in Step 10
    },
  });

  // 13. MessageAnalyzer — DynamoDB Stream trigger, Bedrock moderation, broadcasts to members
  // WEBSOCKET_ENDPOINT wired in Step 8 after WebSocket API is created
  const messageAnalyzerFn = new NodejsFunction(stack, 'MessageAnalyzerFn', {
    ...base,
    entry: entry('MessageAnalyzer'),
    environment: {
      ...commonEnv,
      modelId: 'amazon.nova-micro-v1:0',
      region: stack.region,
      WEBSOCKET_ENDPOINT: '', // TODO: wire in Step 8
    },
  });
  table.grantReadWriteData(messageAnalyzerFn);
  messageAnalyzerFn.addToRolePolicy(new PolicyStatement({
    actions: ['bedrock:InvokeModel'],
    resources: ['*'],
  }));
  messageAnalyzerFn.addToRolePolicy(new PolicyStatement({
    actions: ['execute-api:ManageConnections'],
    resources: ['*'], // tightened in Step 8 with actual API ARN
  }));

  // 14. ImageAnalyzer — S3 PUT trigger, Rekognition moderation, stores result in DynamoDB
  // bucket name comes from S3 event record directly, no env var needed
  const imageAnalyzerFn = new NodejsFunction(stack, 'ImageAnalyzerFn', {
    ...base,
    entry: entry('ImageAnalyzer'),
    environment: commonEnv,
  });
  table.grantReadWriteData(imageAnalyzerFn);
  bucket.grantReadWrite(imageAnalyzerFn);
  imageAnalyzerFn.addToRolePolicy(new PolicyStatement({
    actions: ['rekognition:DetectModerationLabels'],
    resources: ['*'],
  }));

  return {
    authorizerFn,
    connectFn,
    disconnectFn,
    defaultFn,
    sendMessageFn,
    createGroupFn,
    joinGroupFn,
    listGroupsFn,
    fetchHistoryFn,
    askBotFn,
    preSignedUrlFn,
    generateSignedCookiesFn,
    messageAnalyzerFn,
    imageAnalyzerFn,
  };
}
