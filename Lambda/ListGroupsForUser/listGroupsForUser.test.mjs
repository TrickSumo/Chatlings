import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { handler } from './index.mjs';

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => ddbMock.reset());

const makeEvent = (userId = 'user-123') => ({
  requestContext: { authorizer: { userId } },
  body: '{}'
});

test('returns empty array when user has no group memberships', async () => {
  ddbMock.on(QueryCommand).resolves({ Items: [] });
  const result = await handler(makeEvent());
  expect(JSON.parse(result.body).groups).toEqual([]);
});

test('returns groups fetched via BatchGetCommand', async () => {
  ddbMock
    .on(QueryCommand).resolves({
      Items: [{ SK: 'MEMBER#GroupA' }, { SK: 'MEMBER#GroupB' }]
    })
    .on(BatchGetCommand).resolves({
      Responses: {
        Chatlings: [
          { PK: 'GROUP#GroupA', SK: 'META', groupName: 'GroupA' },
          { PK: 'GROUP#GroupB', SK: 'META', groupName: 'GroupB' }
        ]
      },
      UnprocessedKeys: {}
    });
  const { groups } = JSON.parse((await handler(makeEvent())).body);
  expect(groups).toHaveLength(2);
  expect(groups.map(g => g.groupName)).toContain('GroupA');
});

test('retries UnprocessedKeys until all groups are returned', async () => {
  ddbMock
    .on(QueryCommand).resolves({
      Items: [{ SK: 'MEMBER#GroupA' }, { SK: 'MEMBER#GroupB' }]
    })
    .on(BatchGetCommand)
    .resolvesOnce({
      Responses: { Chatlings: [{ PK: 'GROUP#GroupA', SK: 'META', groupName: 'GroupA' }] },
      UnprocessedKeys: { Chatlings: { Keys: [{ PK: 'GROUP#GroupB', SK: 'META' }] } }
    })
    .resolvesOnce({
      Responses: { Chatlings: [{ PK: 'GROUP#GroupB', SK: 'META', groupName: 'GroupB' }] },
      UnprocessedKeys: {}
    });
  const { groups } = JSON.parse((await handler(makeEvent())).body);
  expect(groups).toHaveLength(2);
  expect(groups.map(g => g.groupName)).toContain('GroupB');
  expect(ddbMock.calls().filter(c => c.args[0] instanceof BatchGetCommand)).toHaveLength(2);
});
