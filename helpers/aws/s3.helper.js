import { S3Client } from '@aws-sdk/client-s3';

import { aws } from '../../config/env';

const s3Client = new S3Client({
  endpoint: aws.s3.endpoint,
  region: aws.s3.region,
  credentials: {
    accessKeyId: aws.s3.credentials.accessKeyId,
    secretAccessKey: aws.s3.credentials.secretAccessKey,
  },
  forcePathStyle: aws.s3.forcePathStyle,
});

module.exports = s3Client;
