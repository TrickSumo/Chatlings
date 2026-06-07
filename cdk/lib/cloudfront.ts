import { Stack, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import {
  Distribution, PriceClass, ViewerProtocolPolicy,
  AllowedMethods, CachePolicy, KeyGroup, PublicKey,
  OriginRequestPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin, HttpOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Bucket } from 'aws-cdk-lib/aws-s3';

interface CloudFrontProps {
  mediaBucket: Bucket;
  httpApiDomain: string;
  wsApiDomain: string;
  keyGroup: KeyGroup;
  publicKey: PublicKey;
}

export function createCloudFront(stack: Stack, props: CloudFrontProps) {
  const { mediaBucket, httpApiDomain, wsApiDomain, keyGroup, publicKey } = props;

  // Separate bucket for Vite-built frontend static files
  const frontendBucket = new Bucket(stack, 'ChatlingssFrontendBucket', {
    removalPolicy: RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
  });

  const distribution = new Distribution(stack, 'ChatlingsDistribution', {
    priceClass: PriceClass.PRICE_CLASS_100,
    defaultRootObject: 'index.html',

    // Default — serve React SPA from S3
    defaultBehavior: {
      origin: S3BucketOrigin.withOriginAccessControl(frontendBucket),
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      cachePolicy: CachePolicy.CACHING_OPTIMIZED,
    },

    additionalBehaviors: {
      // Media files — require signed cookies for access control
      '/media/*': {
        origin: S3BucketOrigin.withOriginAccessControl(mediaBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        trustedKeyGroups: [keyGroup],
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
      },
      // HTTP API — never cache (signed cookie generation)
      // Frontend calls: GET /api/getSignedCookie
      '/api*': {
        origin: new HttpOrigin(httpApiDomain),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        cachePolicy: CachePolicy.CACHING_DISABLED,
      },
      // WebSocket API — frontend connects to wss://cloudfront-domain/production/
      '/production*': {
        origin: new HttpOrigin(wsApiDomain),
        viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        cachePolicy: CachePolicy.CACHING_DISABLED,
        originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      },
    },

    // Redirect 403/404 to index.html so React Router handles client-side routes
    errorResponses: [
      { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
      { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
    ],
  });

  // Outputs consumed by deploy.sh
  new CfnOutput(stack, 'CloudFrontDomain', {
    value: distribution.distributionDomainName,
  });
  new CfnOutput(stack, 'CloudFrontDistributionId', {
    value: distribution.distributionId,
  });
  new CfnOutput(stack, 'FrontendBucketName', {
    value: frontendBucket.bucketName,
  });

  return {
    distribution,
    frontendBucket,
    domainName: distribution.distributionDomainName,
    keyPairId: publicKey.publicKeyId,
  };
}
