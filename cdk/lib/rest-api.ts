import { Stack } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi, Cors } from 'aws-cdk-lib/aws-apigateway';
import { Function } from 'aws-cdk-lib/aws-lambda';

interface RestApiProps {
  generateSignedCookiesFn: Function;
}

export function createRestApi(stack: Stack, props: RestApiProps) {
  const { generateSignedCookiesFn } = props;

  const api = new RestApi(stack, 'ChatlingsRestApi', {
    restApiName: 'ChatlingsRestApi',
    defaultCorsPreflightOptions: {
      allowOrigins: Cors.ALL_ORIGINS,
      allowMethods: ['POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      allowCredentials: true,
    },
  });

  // POST /signed-cookies → GenerateSignedCookies Lambda
  const signedCookies = api.root.addResource('signed-cookies');
  signedCookies.addMethod('POST', new LambdaIntegration(generateSignedCookiesFn));

  return { api };
}
