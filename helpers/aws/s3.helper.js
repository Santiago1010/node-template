// =============================================================================
// AWS S3 MANAGER - Complete S3 Operations Handler
// =============================================================================
//
//
// =============================================================================

// =============================================================================
// THIRD-PARTY DEPENDENCIES
// =============================================================================
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
  S3Client,
} = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================
const { S3_CONFIG } = require('../constants.helper');
const { aws } = require('../../config/env');

// =============================================================================
// S3 CLIENT INITIALIZATION
// =============================================================================
const s3Client = new S3Client({
  endpoint: aws.s3.endpoint,
  region: aws.s3.region,
  credentials: aws.s3.credentials,
  forcePathStyle: aws.s3.forcePathStyle,
});

// =============================================================================
// CONSTANTS & CONFIGURATIONS
// =============================================================================

/**
 * AWS S3 Operations Manager
 *
 * @description Comprehensive S3 operations handler with enterprise-grade features:
 * - Robust error handling and retry mechanisms
 * - Input validation and sanitization
 * - Performance optimizations (multipart uploads, streaming)
 * - Security features (pre-signed URLs, CORS management)
 * - Memory-efficient operations for large files
 * - Comprehensive logging and monitoring
 * - Dynamic bucket support with default fallback
 *
 * @class S3Manager
 * @since Version 1.0.0
 * @author Development Team
 */
class S3Manager {
  constructor(client = s3Client, defaultBucket = null) {
    this.s3Client = client;
    this.defaultBucket = defaultBucket;
    this.retryCount = S3_CONFIG.MAX_RETRIES;
  }

  // =============================================================================
  // UTILITY METHODS - Internal helper functions
  // =============================================================================

  /**
   * Resolves bucket name from parameters or uses default
   * @private
   */
  _resolveBucket = (bucket) => {
    const resolvedBucket = bucket || this.defaultBucket;
    if (!resolvedBucket) {
      throw new Error('Bucket name is required. Provide bucket parameter or set default bucket.');
    }
    return this._validateBucketName(resolvedBucket);
  };

  /**
   * Validates S3 bucket name according to AWS naming conventions
   * @private
   */
  _validateBucketName = (bucket) => {
    if (!bucket || typeof bucket !== 'string') {
      throw new Error('Bucket name is required and must be a string');
    }

    const bucketRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    if (!bucketRegex.test(bucket) || bucket.length < 3 || bucket.length > 63) {
      throw new Error('Invalid bucket name format');
    }

    return bucket.toLowerCase();
  };

  /**
   * Validates and sanitizes S3 object key
   * @private
   */
  _validateObjectKey = (key) => {
    if (!key || typeof key !== 'string') {
      throw new Error('Object key is required and must be a string');
    }

    // Remove leading slashes and normalize
    const sanitizedKey = key.replace(/^\/+/, '').trim();
    if (!sanitizedKey) {
      throw new Error('Object key cannot be empty after sanitization');
    }

    return sanitizedKey;
  };

  /**
   * Retry mechanism for S3 operations with exponential backoff
   * @private
   */
  _retryOperation = async (operation, maxRetries = this.retryCount) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry client errors (4xx), only server errors (5xx) and network issues
        if (error.$metadata?.httpStatusCode < 500 && attempt === 1) {
          throw error;
        }

        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff: 1s, 2s, 4s...
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));

        console.warn(`S3 operation attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
      }
    }

    throw new Error(`S3 operation failed after ${maxRetries} attempts: ${lastError.message}`);
  };

  /**
   * Converts stream to buffer efficiently
   * @private
   */
  _streamToBuffer = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  };

  // =============================================================================
  // BUCKET MANAGEMENT METHODS
  // =============================================================================

  /**
   * Set default bucket for operations
   * @param {string} bucket - Default bucket name
   */
  setDefaultBucket = (bucket) => {
    this.defaultBucket = this._validateBucketName(bucket);
  };

  /**
   * Get current default bucket
   * @returns {string|null} Default bucket name
   */
  getDefaultBucket = () => {
    return this.defaultBucket;
  };

  // =============================================================================
  // UPLOAD OPERATIONS - File upload methods with optimization
  // =============================================================================

  /**
   * Upload file to S3 with automatic multipart for large files
   * @param {Object} params - Upload parameters
   * @param {string} [params.bucket] - S3 bucket name (uses default if not provided)
   * @param {string} params.key - Object key/path
   * @param {Buffer|Stream|string} params.body - File content
   * @param {Object} [params.metadata] - Custom metadata
   * @param {string} [params.contentType] - MIME type
   * @param {string} [params.acl] - Access control list
   * @returns {Promise<Object>} Upload result with location and metadata
   */
  uploadFile = async ({ bucket, key, body, metadata = {}, contentType, acl }) => {
    try {
      bucket = this._resolveBucket(bucket);
      key = this._validateObjectKey(key);

      const uploadParams = {
        Bucket: bucket,
        Key: key,
        Body: body,
        Metadata: metadata,
        ...(contentType && { ContentType: contentType }),
        ...(acl && { ACL: acl }),
      };

      // Use multipart upload for large files or streams
      if (Buffer.isBuffer(body) && body.length > S3_CONFIG.MULTIPART_THRESHOLD) {
        return await this._multipartUpload(uploadParams);
      }

      // Regular upload for smaller files
      return await this._retryOperation(async () => {
        const command = new PutObjectCommand(uploadParams);
        const result = await this.s3Client.send(command);

        return {
          success: true,
          location: `s3://${bucket}/${key}`,
          etag: result.ETag,
          versionId: result.VersionId,
          bucket,
          key,
          size: Buffer.isBuffer(body) ? body.length : undefined,
        };
      });
    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  };

  /**
   * Multipart upload for large files with progress tracking
   * @private
   */
  _multipartUpload = async (params) => {
    const upload = new Upload({
      client: this.s3Client,
      params,
      partSize: S3_CONFIG.PART_SIZE,
      queueSize: 4, // Concurrent uploads
    });

    // Optional progress tracking
    upload.on('httpUploadProgress', (progress) => {
      const percentage = Math.round((progress.loaded / progress.total) * 100);
      console.log(`Upload progress: ${percentage}%`);
    });

    const result = await upload.done();

    return {
      success: true,
      location: result.Location,
      etag: result.ETag,
      bucket: result.Bucket,
      key: result.Key,
      versionId: result.VersionId,
    };
  };

  // =============================================================================
  // DOWNLOAD OPERATIONS - File retrieval with streaming support
  // =============================================================================

  /**
   * Download file from S3 with efficient streaming
   * @param {Object} params - Download parameters
   * @param {string} [params.bucket] - S3 bucket name (uses default if not provided)
   * @param {string} params.key - Object key/path
   * @param {boolean} [params.asBuffer=false] - Return as Buffer instead of stream
   * @param {string} [params.range] - Byte range (e.g., "bytes=0-1023")
   * @returns {Promise<Object>} Download result with stream/buffer and metadata
   */
  downloadFile = async ({ bucket, key, asBuffer = false, range }) => {
    try {
      bucket = this._resolveBucket(bucket);
      key = this._validateObjectKey(key);

      return await this._retryOperation(async () => {
        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: key,
          ...(range && { Range: range }),
        });

        const result = await this.s3Client.send(command);

        const response = {
          success: true,
          body: asBuffer ? await this._streamToBuffer(result.Body) : result.Body,
          metadata: result.Metadata || {},
          contentType: result.ContentType,
          contentLength: result.ContentLength,
          lastModified: result.LastModified,
          etag: result.ETag,
          versionId: result.VersionId,
        };

        return response;
      });
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        throw new Error(`File not found: s3://${bucket}/${key}`);
      }
      console.error('Download failed:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }
  };

  /**
   * Get file metadata without downloading content
   * @param {Object} params - Parameters
   * @param {string} [params.bucket] - S3 bucket name (uses default if not provided)
   * @param {string} params.key - Object key/path
   * @returns {Promise<Object>} File metadata
   */
  getFileMetadata = async ({ bucket, key }) => {
    try {
      bucket = this._resolveBucket(bucket);
      key = this._validateObjectKey(key);

      return await this._retryOperation(async () => {
        const command = new HeadObjectCommand({ Bucket: bucket, Key: key });
        const result = await this.s3Client.send(command);

        return {
          success: true,
          contentType: result.ContentType,
          contentLength: result.ContentLength,
          lastModified: result.LastModified,
          etag: result.ETag,
          versionId: result.VersionId,
          metadata: result.Metadata || {},
          storageClass: result.StorageClass,
        };
      });
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return { success: false, exists: false };
      }
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  };

  // =============================================================================
  // DELETE OPERATIONS - File and batch deletion
  // =============================================================================

  /**
   * Delete single file from S3
   * @param {Object} params - Delete parameters
   * @param {string} [params.bucket] - S3 bucket name (uses default if not provided)
   * @param {string} params.key - Object key/path
   * @returns {Promise<Object>} Deletion result
   */
  deleteFile = async ({ bucket, key }) => {
    try {
      bucket = this._resolveBucket(bucket);
      key = this._validateObjectKey(key);

      return await this._retryOperation(async () => {
        const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
        const result = await this.s3Client.send(command);

        return {
          success: true,
          deleted: true,
          key,
          versionId: result.VersionId,
        };
      });
    } catch (error) {
      console.error('Delete failed:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  };

  /**
   * Delete multiple files in batch (up to 1000 files)
   * @param {Object} params - Batch delete parameters
   * @param {string} [params.bucket] - S3 bucket name (uses default if not provided)
   * @param {Array<string>} params.keys - Array of object keys
   * @returns {Promise<Object>} Batch deletion result
   */
  deleteFiles = async ({ bucket, keys }) => {
    try {
      bucket = this._resolveBucket(bucket);

      if (!Array.isArray(keys) || keys.length === 0) {
        throw new Error('Keys must be a non-empty array');
      }

      if (keys.length > 1000) {
        throw new Error('Cannot delete more than 1000 files in a single batch');
      }

      const objects = keys.map((key) => ({ Key: this._validateObjectKey(key) }));

      return await this._retryOperation(async () => {
        const command = new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: objects },
        });

        const result = await this.s3Client.send(command);

        return {
          success: true,
          deleted: result.Deleted || [],
          errors: result.Errors || [],
          totalRequested: keys.length,
          totalDeleted: (result.Deleted || []).length,
          totalErrors: (result.Errors || []).length,
        };
      });
    } catch (error) {
      console.error('Batch delete failed:', error);
      throw new Error(`Failed to delete files: ${error.message}`);
    }
  };

  // =============================================================================
  // LIST OPERATIONS - Directory and file listing
  // =============================================================================

  /**
   * List objects in S3 bucket with pagination support
   * @param {Object} params - List parameters
   * @param {string} [params.bucket] - S3 bucket name (uses default if not provided)
   * @param {string} [params.prefix] - Object key prefix filter
   * @param {string} [params.delimiter] - Delimiter for hierarchical listing
   * @param {number} [params.maxKeys] - Maximum number of keys to return
   * @param {string} [params.continuationToken] - Token for pagination
   * @returns {Promise<Object>} List result with objects and pagination info
   */
  listFiles = async ({
    bucket,
    prefix = '',
    delimiter,
    maxKeys = S3_CONFIG.MAX_KEYS_PER_REQUEST,
    continuationToken,
  }) => {
    try {
      bucket = this._resolveBucket(bucket);

      return await this._retryOperation(async () => {
        const command = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          MaxKeys: Math.min(maxKeys, S3_CONFIG.MAX_KEYS_PER_REQUEST),
          ...(delimiter && { Delimiter: delimiter }),
          ...(continuationToken && { ContinuationToken: continuationToken }),
        });

        const result = await this.s3Client.send(command);

        return {
          success: true,
          objects: (result.Contents || []).map((obj) => ({
            key: obj.Key,
            size: obj.Size,
            lastModified: obj.LastModified,
            etag: obj.ETag,
            storageClass: obj.StorageClass,
            owner: obj.Owner,
          })),
          prefixes: (result.CommonPrefixes || []).map((p) => p.Prefix),
          isTruncated: result.IsTruncated || false,
          nextContinuationToken: result.NextContinuationToken,
          keyCount: result.KeyCount || 0,
          maxKeys: result.MaxKeys || maxKeys,
        };
      });
    } catch (error) {
      console.error('List files failed:', error);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  };

  /**
   * List all objects with automatic pagination
   * @param {Object} params - List all parameters
   * @param {string} [params.bucket] - S3 bucket name (uses default if not provided)
   * @param {string} [params.prefix] - Object key prefix filter
   * @returns {Promise<Array>} All objects in bucket/prefix
   */
  listAllFiles = async ({ bucket, prefix = '' }) => {
    const allObjects = [];
    let continuationToken = null;

    do {
      const result = await this.listFiles({
        bucket,
        prefix,
        continuationToken,
      });

      allObjects.push(...result.objects);
      continuationToken = result.nextContinuationToken;
    } while (continuationToken);

    return allObjects;
  };

  // =============================================================================
  // COPY OPERATIONS - File copying and moving
  // =============================================================================

  /**
   * Copy file within S3 or between buckets
   * @param {Object} params - Copy parameters
   * @param {string} [params.sourceBucket] - Source bucket name (uses default if not provided)
   * @param {string} params.sourceKey - Source object key
   * @param {string} [params.destinationBucket] - Destination bucket name (uses default if not provided)
   * @param {string} params.destinationKey - Destination object key
   * @param {Object} [params.metadata] - New metadata (optional)
   * @returns {Promise<Object>} Copy result
   */
  copyFile = async ({ sourceBucket, sourceKey, destinationBucket, destinationKey, metadata }) => {
    try {
      sourceBucket = this._resolveBucket(sourceBucket);
      sourceKey = this._validateObjectKey(sourceKey);
      destinationBucket = this._resolveBucket(destinationBucket);
      destinationKey = this._validateObjectKey(destinationKey);

      return await this._retryOperation(async () => {
        const command = new CopyObjectCommand({
          CopySource: `${sourceBucket}/${sourceKey}`,
          Bucket: destinationBucket,
          Key: destinationKey,
          ...(metadata && {
            Metadata: metadata,
            MetadataDirective: 'REPLACE',
          }),
        });

        const result = await this.s3Client.send(command);

        return {
          success: true,
          source: `s3://${sourceBucket}/${sourceKey}`,
          destination: `s3://${destinationBucket}/${destinationKey}`,
          etag: result.CopyObjectResult?.ETag,
          lastModified: result.CopyObjectResult?.LastModified,
          versionId: result.VersionId,
        };
      });
    } catch (error) {
      console.error('Copy failed:', error);
      throw new Error(`Failed to copy file: ${error.message}`);
    }
  };

  /**
   * Move file (copy + delete source)
   * @param {Object} params - Move parameters (same as copy)
   * @returns {Promise<Object>} Move result
   */
  moveFile = async (params) => {
    try {
      // First copy the file
      const copyResult = await this.copyFile(params);

      // Then delete the source file
      await this.deleteFile({
        bucket: params.sourceBucket,
        key: params.sourceKey,
      });

      return {
        ...copyResult,
        moved: true,
        sourceDeleted: true,
      };
    } catch (error) {
      console.error('Move failed:', error);
      throw new Error(`Failed to move file: ${error.message}`);
    }
  };

  // =============================================================================
  // URL OPERATIONS - Pre-signed URLs for secure access
  // =============================================================================

  /**
   * Generate pre-signed URL for file upload
   * @param {Object} params - URL parameters
   * @param {string} [params.bucket] - S3 bucket name (uses default if not provided)
   * @param {string} params.key - Object key/path
   * @param {number} [params.expiresIn] - URL expiration in seconds
   * @param {string} [params.contentType] - Expected content type
   * @returns {Promise<Object>} Pre-signed URL and metadata
   */
  getUploadUrl = async ({ bucket, key, expiresIn = S3_CONFIG.DEFAULT_EXPIRATION, contentType }) => {
    try {
      bucket = this._resolveBucket(bucket);
      key = this._validateObjectKey(key);

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ...(contentType && { ContentType: contentType }),
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });

      return {
        success: true,
        uploadUrl: url,
        bucket,
        key,
        expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      };
    } catch (error) {
      console.error('Generate upload URL failed:', error);
      throw new Error(`Failed to generate upload URL: ${error.message}`);
    }
  };

  /**
   * Generate pre-signed URL for file download
   * @param {Object} params - URL parameters
   * @param {string} [params.bucket] - S3 bucket name (uses default if not provided)
   * @param {string} params.key - Object key/path
   * @param {number} [params.expiresIn] - URL expiration in seconds
   * @param {string} [params.responseContentDisposition] - Content disposition header
   * @returns {Promise<Object>} Pre-signed URL and metadata
   */
  getDownloadUrl = async ({ bucket, key, expiresIn = S3_CONFIG.DEFAULT_EXPIRATION, responseContentDisposition }) => {
    try {
      bucket = this._resolveBucket(bucket);
      key = this._validateObjectKey(key);

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ...(responseContentDisposition && { ResponseContentDisposition: responseContentDisposition }),
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });

      return {
        success: true,
        downloadUrl: url,
        bucket,
        key,
        expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      };
    } catch (error) {
      console.error('Generate download URL failed:', error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  };

  // =============================================================================
  // UTILITY OPERATIONS - Additional helper methods
  // =============================================================================

  /**
   * Check if file exists in S3
   * @param {Object} params - Parameters
   * @param {string} [params.bucket] - S3 bucket name (uses default if not provided)
   * @param {string} params.key - Object key/path
   * @returns {Promise<boolean>} True if file exists
   */
  fileExists = async ({ bucket, key }) => {
    try {
      const metadata = await this.getFileMetadata({ bucket, key });
      return metadata.success;
    } catch (error) {
      console.error('File exists check failed:', error);
      return false;
    }
  };

  /**
   * Get file size without downloading
   * @param {Object} params - Parameters
   * @param {string} [params.bucket] - S3 bucket name (uses default if not provided)
   * @param {string} params.key - Object key/path
   * @returns {Promise<number>} File size in bytes
   */
  getFileSize = async ({ bucket, key }) => {
    const metadata = await this.getFileMetadata({ bucket, key });
    if (!metadata.success) {
      throw new Error(`File not found: s3://${bucket}/${key}`);
    }
    return metadata.contentLength;
  };

  /**
   * Cleanup incomplete multipart uploads
   * @param {Object} params - Parameters
   * @param {string} [params.bucket] - S3 bucket name (uses default if not provided)
   * @param {number} [params.olderThanDays=7] - Delete uploads older than X days
   * @returns {Promise<Object>} Cleanup result
   */
  cleanupMultipartUploads = async () => {
    // Implementation would require ListMultipartUploads and AbortMultipartUpload
    // This is a placeholder for the method signature
    console.warn('cleanupMultipartUploads: Implementation pending');
    return { success: false, message: 'Method not implemented' };
  };
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================
module.exports = S3Manager;
