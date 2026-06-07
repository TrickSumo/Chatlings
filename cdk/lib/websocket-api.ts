import { Stack } from 'aws-cdk-lib';
import { WebSocketApi, WebSocketStage } from 'aws-cdk-lib/aws-apigatewayv2';
import { WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { WebSocketLambdaAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { Function } from 'aws-cdk-lib/aws-lambda';

interface WebSocketApiProps {
  authorizerFn: Function;
  connectFn: Function;
  disconnectFn: Function;
  defaultFn: Function;
  sendMessageFn: Function;
  createGroupFn: Function;
  joinGroupFn: Function;
  listGroupsFn: Function;
  fetchHistoryFn: Function;
  askBotFn: Function;
  preSignedUrlFn: Function;
}

export function createWebSocketApi(stack: Stack, props: WebSocketApiProps) {
  const {
    authorizerFn, connectFn, disconnectFn, defaultFn,
    sendMessageFn, createGroupFn, joinGroupFn,
    listGroupsFn, fetchHistoryFn, askBotFn, preSignedUrlFn,
  } = props;

  const authorizer = new WebSocketLambdaAuthorizer('ChatlingsAuthorizer', authorizerFn, {
    identitySource: ['route.request.querystring.Authorization'],
  });

  const api = new WebSocketApi(stack, 'ChatlingsWebSocketApi', {
    connectRouteOptions: {
      integration: new WebSocketLambdaIntegration('ConnectIntegration', connectFn),
      authorizer,
    },
    disconnectRouteOptions: {
      integration: new WebSocketLambdaIntegration('DisconnectIntegration', disconnectFn),
    },
    defaultRouteOptions: {
      integration: new WebSocketLambdaIntegration('DefaultIntegration', defaultFn),
    },
  });

  // Custom action routes
  api.addRoute('sendMessage',         { integration: new WebSocketLambdaIntegration('SendMessageIntegration',    sendMessageFn) });
  api.addRoute('createGroup',         { integration: new WebSocketLambdaIntegration('CreateGroupIntegration',    createGroupFn) });
  api.addRoute('joinGroup',           { integration: new WebSocketLambdaIntegration('JoinGroupIntegration',      joinGroupFn) });
  api.addRoute('listGroupsForUser',   { integration: new WebSocketLambdaIntegration('ListGroupsIntegration',     listGroupsFn) });
  api.addRoute('fetchGroupChatHistory', { integration: new WebSocketLambdaIntegration('FetchHistoryIntegration', fetchHistoryFn) });
  api.addRoute('askBot',              { integration: new WebSocketLambdaIntegration('AskBotIntegration',         askBotFn) });
  api.addRoute('generatePreSignedUrl', { integration: new WebSocketLambdaIntegration('PreSignedUrlIntegration',  preSignedUrlFn) });

  const stage = new WebSocketStage(stack, 'ChatlingsWebSocketStage', {
    webSocketApi: api,
    stageName: 'production',
    autoDeploy: true,
  });

  // HTTP callback URL used by MessageAnalyzer to PostToConnection
  const callbackUrl = stage.callbackUrl;

  // Raw domain needed by CloudFront HttpOrigin (no protocol prefix)
  const wsApiDomain = `${api.apiId}.execute-api.${stack.region}.amazonaws.com`;

  return { api, stage, callbackUrl, wsApiDomain };
}
