import { Stack } from 'aws-cdk-lib';
import { HttpApi, CorsHttpMethod, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Function } from 'aws-cdk-lib/aws-lambda';

interface HttpApiProps {
  generateSignedCookiesFn: Function;
}

export function createRestApi(stack: Stack, props: HttpApiProps) {
  const { generateSignedCookiesFn } = props;

  const api = new HttpApi(stack, 'ChatlingsHttpApi', {
    corsPreflight: {
      allowOrigins: ['*'],
      allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.OPTIONS],
      allowHeaders: ['Content-Type', 'Authorization'],
    },
  });

  // Frontend calls GET /api/getSignedCookie through CloudFront /api* behavior
  api.addRoutes({
    path: '/api/getSignedCookie',
    methods: [HttpMethod.GET],
    integration: new HttpLambdaIntegration('SignedCookiesIntegration', generateSignedCookiesFn),
  });

  // Raw domain needed by CloudFront HttpOrigin (no protocol prefix)
  const apiDomain = `${api.apiId}.execute-api.${stack.region}.amazonaws.com`;

  return { api, apiDomain };
}
