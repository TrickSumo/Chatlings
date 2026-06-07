import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from './index.mjs';

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => ddbMock.reset());

const makeEvent = (body, userId = 'user-123') => ({
  requestContext: { authorizer: { userId } },
  body: JSON.stringify(body)
});

test('returns 400 on invalid JSON body', async () => {
  const result = await handler({ requestContext: { authorizer: { userId: 'u1' } }, body: '{bad json' });
  expect(JSON.parse(result.body).statusCode).toBe(400);
});

test('returns 400 when groupName is missing', async () => {
  const result = await handler(makeEvent({ groupCode: 'ABC' }));
  const body = JSON.parse(result.body);
  expect(body.statusCode).toBe(400);
  expect(body.error).toBe('Group name is required!');
});

test('returns 500 with "Group already exists!" on ConditionalCheckFailed', async () => {
  ddbMock.on(TransactWriteCommand).rejects(
    Object.assign(new Error('TransactionCanceledException'), {
      CancellationReasons: [{ Code: 'ConditionalCheckFailed' }]
    })
  );
  const result = await handler(makeEvent({ groupName: 'MyGroup' }));
  const body = JSON.parse(result.body);
  expect(body.statusCode).toBe(500);
  expect(body.error).toBe('Group already exists!');
});

test('returns 200 with correct group shape on success', async () => {
  ddbMock.on(TransactWriteCommand).resolves({ $metadata: { httpStatusCode: 200 } });
  const result = await handler(makeEvent({ groupName: 'MyGroup', groupCode: 'MG01', groupIcon: '🚀' }));
  const body = JSON.parse(result.body);
  expect(body.statusCode).toBe(200);
  expect(body.message.groupName).toBe('MyGroup');
  expect(body.message.groupCode).toBe('MG01');
  expect(body.message.PK).toBe('GROUP#MyGroup');
  expect(body.message.createdBy).toBe('USER#user-123');
});
