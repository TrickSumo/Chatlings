import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from './index.mjs';

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => ddbMock.reset());

const makeEvent = (body) => ({ body: JSON.stringify(body) });

test('returns 400 when groupName is missing', async () => {
  const result = await handler(makeEvent({}));
  expect(JSON.parse(result.body).statusCode).toBe(400);
});

test('uses ScanIndexForward: false and Limit: 60', async () => {
  ddbMock.on(QueryCommand).resolves({ Items: [] });
  await handler(makeEvent({ groupName: 'group1' }));
  const input = ddbMock.calls()[0].args[0].input;
  expect(input.ScanIndexForward).toBe(false);
  expect(input.Limit).toBe(60);
});

test('reverses DynamoDB response into chronological order', async () => {
  // DynamoDB returns newest-first (ScanIndexForward: false); handler reverses for display
  ddbMock.on(QueryCommand).resolves({
    Items: [
      { SK: 'MESSAGE#2024-01-03', message: 'newest' },
      { SK: 'MESSAGE#2024-01-02', message: 'middle' },
      { SK: 'MESSAGE#2024-01-01', message: 'oldest' },
    ]
  });
  const result = await handler(makeEvent({ groupName: 'group1' }));
  const { messages } = JSON.parse(result.body);
  expect(messages[0].message).toBe('oldest');
  expect(messages[2].message).toBe('newest');
});

test('passes ExclusiveStartKey when lastEvaluatedKey is provided', async () => {
  const lastKey = { PK: 'GROUP#group1', SK: 'MESSAGE#2024-01-01' };
  ddbMock.on(QueryCommand).resolves({ Items: [] });
  await handler(makeEvent({ groupName: 'group1', lastEvaluatedKey: lastKey }));
  expect(ddbMock.calls()[0].args[0].input.ExclusiveStartKey).toEqual(lastKey);
});

test('returns lastEvaluatedKey: null when no more pages exist', async () => {
  ddbMock.on(QueryCommand).resolves({ Items: [] });
  const result = await handler(makeEvent({ groupName: 'group1' }));
  expect(JSON.parse(result.body).lastEvaluatedKey).toBeNull();
});
