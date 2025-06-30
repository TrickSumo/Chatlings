import jwt from 'jsonwebtoken';
import { createPublicKey } from 'crypto';


const userPoolId = process.env.userPoolId;
const region = process.env.region;

const cognitoSigningKeyUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;

let jwtSigningKey = null;

const getJwtSigningKey = async (accessToken, kid) => {
  const response = await (await fetch(cognitoSigningKeyUrl)).json();
  const jwk = response?.keys?.find(key => key.kid === kid);
  const key = createPublicKey({ format: 'jwk', key: jwk }).export({ format: 'pem', type: 'spki' });

  jwtSigningKey = key;
  return key;
}

export const handler = async (event) => {
  console.log("auth called", event);

  const token = event.queryStringParameters?.Authorization
  console.log(token);


  try {

    const methodArn = event?.methodArn;
    const accessToken = event?.queryStringParameters?.Authorization;
    if (!accessToken) {
      throw new Error('Unauthorized');
    }
    const { header: tokenHeader, payload: tokenPayload } = jwt.decode(accessToken, { complete: true });

    return jwt.verify(accessToken, jwtSigningKey || await getJwtSigningKey(accessToken, tokenHeader.kid), { 'algorithms': tokenHeader.alg }, (err) => {
      if (err) {
        console.log(err);
        throw new Error('Unauthorized');
      }
      console.log("auth success");
      return {
        "principalId": "connected Successfully",
        "policyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Action": "execute-api:Invoke",
              "Effect": "Allow",
              "Resource": methodArn
            }
          ]
        },
        "context": {
          "username": tokenPayload?.username || "unknown",
          "userId": tokenPayload?.sub || "unknown"
        }
      }
    });

  }

  catch (error) {
    console.log(error);
    return {
      principalId: "unauthorized",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: event.methodArn,
          },
        ],
      },
      context: {},
    };
  }
};
