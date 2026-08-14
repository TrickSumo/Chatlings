#!/usr/bin/env bash
set -e

echo "Deploying Chatlings..."

# 1 — Deploy CDK stack, save all outputs to a file
(cd cdk && npx cdk deploy --outputs-file ../cdk-outputs.json --require-approval never)

# 2 — Parse outputs using node (no jq needed)
out() { node -e "process.stdout.write(require('./cdk-outputs.json').CdkStack['$1'])"; }

CLOUDFRONT_DOMAIN=$(out CloudFrontDomain)
DISTRIBUTION_ID=$(out CloudFrontDistributionId)
FRONTEND_BUCKET=$(out FrontendBucketName)
COGNITO_AUTHORITY=$(out CognitoAuthority)
COGNITO_CLIENT_ID=$(out UserPoolClientId)
COGNITO_DOMAIN=$(out CognitoUserPoolDomain)

# 3 — Write Frontend/.env with resolved values
cat > Frontend/.env <<EOF
VITE_API_BASE_URL=$CLOUDFRONT_DOMAIN
VITE_COGNITO_AUTHORITY=$COGNITO_AUTHORITY
VITE_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
VITE_COGNITO_USER_POOL_CLIENT_ID=$COGNITO_CLIENT_ID
VITE_COGNITO_USER_POOL_DOMAIN=$COGNITO_DOMAIN
EOF

echo "Frontend/.env written"

# 4 — Build the React app
(cd Frontend && npm run build)

# 5 — Sync build output to S3 (delete removed files)
aws s3 sync Frontend/dist/ "s3://$FRONTEND_BUCKET" --delete

# 6 — Invalidate CloudFront cache so users get the new build immediately
aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text

echo "Done! App: https://$CLOUDFRONT_DOMAIN"
