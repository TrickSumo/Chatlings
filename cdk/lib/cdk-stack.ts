import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as dynamo from 'aws-cdk-lib/aws-dynamodb'
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dynamoDbTable = new dynamo.Table(this, 'MyTable', {
      partitionKey: { name: 'id', type: dynamo.AttributeType.STRING },
      tableName: 'chatlings',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
