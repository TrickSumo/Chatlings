import { jest } from '@jest/globals';

const mockDecode = jest.fn();
const mockVerify = jest.fn();

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { decode: mockDecode, verify: mockVerify }
}));

const { handler } = await import('./index.mjs');

beforeEach(() => {
  mockDecode.mockReset();
  mockVerify.mockReset();
});

const makeEvent = (token) => ({
  queryStringParameters: token ? { Authorization: token } : {},
  methodArn: 'arn:aws:execute-api:us-east-1:123456789:testapi/prod/$connect'
});

test('returns Deny policy when no Authorization token is present', async () => {
  const result = await handler(makeEvent(null));
  expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
  expect(result.principalId).toBe('unauthorized');
});

test('returns Deny policy when jwt.decode throws (malformed token)', async () => {
  mockDecode.mockImplementation(() => { throw new Error('malformed token'); });
  const result = await handler(makeEvent('bad.token.here'));
  expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
});
