// =============================================================================
// AWS S3 CLIENT CONFIGURATION - Singleton client instance for AWS S3 operations
// =============================================================================
//
// =============================================================================

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const { S3Client } = require('@aws-sdk/client-s3'); // AWS SDK v3 S3 client implementation

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { aws } = require('../../config/env'); // Centralized AWS configuration management

/**
 * AWS S3 Client Singleton Instance
 *
 * @description Pre-configured S3 client instance for AWS S3 or compatible storage services.
 * Provides optimized connection pooling and authentication handling for all S3 operations.
 * Configured through environment variables for maximum flexibility across environments.
 *
 * @type {import('@aws-sdk/client-s3').S3Client}
 *
 * @complexity Time: O(1) for client initialization, Space: O(1) singleton instance
 * @since Version 1.0.0
 * @see {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/ | AWS S3 SDK Documentation}
 */
const s3Client = new S3Client({
  // Custom endpoint for S3-compatible services (MinIO, DigitalOcean Spaces, etc.)
  endpoint: aws.s3.endpoint,

  // AWS region for standard S3 operations (us-east-1, eu-west-1, etc.)
  region: aws.s3.region,

  // Authentication credentials (access key and secret)
  credentials: {
    accessKeyId: aws.s3.credentials.accessKeyId,
    secretAccessKey: aws.s3.credentials.secretAccessKey,
  },

  // Path-style addressing for S3-compatible services that don't support virtual hosting
  forcePathStyle: aws.s3.forcePathStyle,
});

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = s3Client;
