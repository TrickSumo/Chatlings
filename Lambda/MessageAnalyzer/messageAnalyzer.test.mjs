import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

// Must be set before dynamic import — handler reads these at module-load time
process.env.WEBSOCKET_ENDPOINT = 'https://test.execute-api.us-east-1.amazonaws.com/production';
process.env.tableName = 'Chatlings';

const { handler } = await import('./index.mjs');

const ddbMock = mockClient(DynamoDBDocumentClient);
const bedrockMock = mockClient(BedrockRuntimeClient);
const apigwMock = mockClient(ApiGatewayManagementApiClient);

beforeEach(() => {
  ddbMock.reset();
  bedrockMock.reset();
  apigwMock.reset();
});

const makeRecord = (message, type = 'txt', eventName = 'INSERT') => ({
  Records: [{
    eventName,
    dynamodb: {
      Keys: {
        PK: { S: 'GROUP#testgroup' },
        SK: { S: 'MESSAGE#2024-01-01T00:00:00.000Z' }
      },
      NewImage: {
        message: { S: message },
        sentBy: { S: 'testuser' },
        sentAt: { S: '2024-01-01T00:00:00.000Z' },
        type: { S: type }
      }
    }
  }]
});

const setupGroupMembers = () => {
  ddbMock
    .on(QueryCommand).resolves({ Items: [{ SK: 'MEMBER#user-456' }] })
    .on(BatchGetCommand).resolves({
      Responses: { Chatlings: [{ PK: 'USER#user-456', connectionId: 'conn-abc' }] },
      UnprocessedKeys: {}
    });
};

const getNotification = () =>
  JSON.parse(apigwMock.calls()[0].args[0].input.Data);

test('skips non-INSERT records entirely', async () => {
  await handler(makeRecord('hello', 'txt', 'MODIFY'));
  expect(bedrockMock.calls()).toHaveLength(0);
  expect(apigwMock.calls()).toHaveLength(0);
});

test('skips Bedrock for image messages and broadcasts directly', async () => {
  setupGroupMembers();
  apigwMock.on(PostToConnectionCommand).resolves({});
  await handler(makeRecord('media/photo.jpg', 'img'));
  expect(bedrockMock.calls()).toHaveLength(0);
  expect(apigwMock.calls()).toHaveLength(1);
  expect(getNotification().action).toBe('newMessage');
});

test('broadcasts original message when Bedrock returns SAFE', async () => {
  setupGroupMembers();
  bedrockMock.on(ConverseCommand).resolves({
    output: { message: { content: [{ text: 'SAFE' }] } }
  });
  apigwMock.on(PostToConnectionCommand).resolves({});
  await handler(makeRecord('hello everyone'));
  const notification = getNotification();
  expect(notification.action).toBe('newMessage');
  expect(notification.message.message).toBe('hello everyone');
  expect(notification.groupName).toBe('testgroup');
});

test('replaces message and broadcasts moderation notice when Bedrock returns UNSAFE', async () => {
  setupGroupMembers();
  bedrockMock.on(ConverseCommand).resolves({
    output: { message: { content: [{ text: 'UNSAFE' }] } }
  });
  ddbMock.on(UpdateCommand).resolves({});
  apigwMock.on(PostToConnectionCommand).resolves({});
  await handler(makeRecord('you are stupid'));
  const updateCall = ddbMock.calls().find(c => c.args[0] instanceof UpdateCommand);
  expect(updateCall.args[0].input.UpdateExpression).toContain('moderation');
  const notification = getNotification();
  expect(notification.action).toBe('messageModerated');
  expect(notification.message.message).toBe('Message removed by moderator');
});

test('falls back to original message when Bedrock throws', async () => {
  setupGroupMembers();
  bedrockMock.on(ConverseCommand).rejects(new Error('Bedrock unavailable'));
  apigwMock.on(PostToConnectionCommand).resolves({});
  await handler(makeRecord('hello'));
  const notification = getNotification();
  expect(notification.action).toBe('newMessage');
  expect(notification.message.message).toBe('hello');
});

test('removes stale connectionId from DynamoDB on 410 Gone', async () => {
  setupGroupMembers();
  bedrockMock.on(ConverseCommand).resolves({
    output: { message: { content: [{ text: 'SAFE' }] } }
  });
  const goneError = Object.assign(new Error('Gone'), { $metadata: { httpStatusCode: 410 } });
  apigwMock.on(PostToConnectionCommand).rejects(goneError);
  ddbMock.on(UpdateCommand).resolves({});
  await handler(makeRecord('hello'));
  const cleanupCall = ddbMock.calls().find(
    c => c.args[0] instanceof UpdateCommand &&
         c.args[0].input.UpdateExpression === 'REMOVE connectionId'
  );
  expect(cleanupCall).toBeDefined();
  expect(cleanupCall.args[0].input.Key.PK).toBe('USER#user-456');
});
