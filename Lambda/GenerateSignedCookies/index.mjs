import { getSignedCookies } from "@aws-sdk/cloudfront-signer";

const privateKeyRaw = process.env.privateKey;
const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

const cloudfrontDistributionDomain = process.env.cloudfrontDistributionDomain;
const keyPairId = process.env.keyPairId;
const intervalToAddInMilliseconds = 86400 * 1000; // 24 hours in milliseconds 

if (!privateKey || !cloudfrontDistributionDomain || !keyPairId) {
  console.error('Values not set in environment variables');
}

export const handler = async (event) => {
  if (!privateKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'privateKey not set in environment variables' }),
    };
  }

  const s3ObjectKey = "*";
  const url = `${cloudfrontDistributionDomain}/${s3ObjectKey}`;
  const dateLessThan = Math.floor((Date.now() + intervalToAddInMilliseconds) / 1000);

  const policy = {
    Statement: [
      {
        "Resource": url,
        Condition: {
          DateLessThan: {
            "AWS:EpochTime": dateLessThan,
          },
        },
      },
    ],
  };
  const policyString = JSON.stringify(policy);


  const cookies = getSignedCookies({
    keyPairId,
    privateKey,
    policy: policyString,
  });

  const expires = new Date(dateLessThan * 1000).toUTCString();

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    cookies: [
      `CloudFront-Key-Pair-Id=${cookies['CloudFront-Key-Pair-Id']}; Expires=${expires}; Path=/; Secure; HttpOnly; SameSite=None;`,
      `CloudFront-Signature=${cookies['CloudFront-Signature']}; Expires=${expires}; Path=/; Secure; HttpOnly; SameSite=None`,
      `CloudFront-Policy=${cookies['CloudFront-Policy']}; Expires=${expires}; Path=/; Secure; HttpOnly; SameSite=None;`,
    ],
    body: JSON.stringify({ message: 'Cookies created successfully!' }),
  };
};