import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from './index.mjs';

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => ddbMock.reset());

const makeEvent = (body, userId = 'user-123', username = 'alice') => ({
  requestContext: { authorizer: { userId, username } },
  body: JSON.stringify(body)
});

test('returns 400 on invalid JSON body', async () => {
  const result = await handler({ requestContext: { authorizer: {} }, body: 'not json' });
  expect(JSON.parse(result.body).statusCode).toBe(400);
});

test('returns 400 when groupName is missing', async () => {
  const result = await handler(makeEvent({ message: 'hello' }));
  expect(JSON.parse(result.body).statusCode).toBe(400);
});

test('returns 400 when message is missing', async () => {
  const result = await handler(makeEvent({ groupName: 'group1' }));
  expect(JSON.parse(result.body).statusCode).toBe(400);
});

test('returns 403 when user is not a group member', async () => {
  ddbMock.on(GetCommand).resolves({ Item: undefined });
  const result = await handler(makeEvent({ groupName: 'group1', message: 'hello' }));
  expect(JSON.parse(result.body).statusCode).toBe(403);
});

test('returns 200 with message item on success', async () => {
  ddbMock
    .on(GetCommand).resolves({ Item: { PK: 'USER#user-123', SK: 'MEMBER#group1' } })
    .on(PutCommand).resolves({ $metadata: { httpStatusCode: 200 } });
  const result = await handler(makeEvent({ groupName: 'group1', message: 'hello world' }));
  const body = JSON.parse(result.body);
  expect(body.statusCode).toBe(200);
  expect(body.message.message).toBe('hello world');
  expect(body.message.sentBy).toBe('alice');
  expect(body.message.PK).toBe('GROUP#group1');
  expect(body.message.type).toBe('txt');
});
