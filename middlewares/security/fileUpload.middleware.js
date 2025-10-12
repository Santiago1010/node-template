const path = require('path');
const crypto = require('crypto');

const boom = require('@hapi/boom');

const i18n = require('../../config/i18n');
const { logger } = require('../../config/tools/logger.config');
const { ALLOWED_MIME_TYPES, DANGEROUS_EXTENSIONS, FILE_SIGNATURE_MAP } = require('../../utils/constants.util');

class FileUploadGuard {
  static validateFileType(allowedTypes = ['image']) {
    return (req, _, next) => {
      try {
        if (!req.files || Object.keys(req.files).length === 0) {
          return next();
        }

        const files = Array.isArray(req.files) ? req.files : Object.values(req.files);
        const allowedMimeTypes = allowedTypes.flatMap((type) => ALLOWED_MIME_TYPES[type] || []);

        for (const file of files) {
          const fileMimeType = file.mimetype;
          const fileExtension = path.extname(file.name).toLowerCase();

          if (DANGEROUS_EXTENSIONS.includes(fileExtension)) {
            logger.warn('Dangerous file extension detected', {
              filename: file.name,
              extension: fileExtension,
              ip: req.ip,
              accountId: req.user?.accountId,
            });
            throw boom.badRequest(i18n.__('error.file_type_not_allowed'));
          }

          if (!allowedMimeTypes.includes(fileMimeType)) {
            logger.warn('Invalid file MIME type', {
              filename: file.name,
              mimetype: fileMimeType,
              ip: req.ip,
              accountId: req.user?.accountId,
            });
            throw boom.badRequest(i18n.__('error.file_type_not_allowed'));
          }
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static validateFileSize(maxSizeMB = 10) {
    return (req, _, next) => {
      try {
        if (!req.files || Object.keys(req.files).length === 0) {
          return next();
        }

        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        const files = Array.isArray(req.files) ? req.files : Object.values(req.files);

        for (const file of files) {
          if (file.size > maxSizeBytes) {
            logger.warn('File size exceeds limit', {
              filename: file.name,
              size: file.size,
              maxSize: maxSizeBytes,
              ip: req.ip,
              accountId: req.user?.accountId,
            });
            throw boom.badRequest(i18n.__('error.file_too_large', { maxSize: maxSizeMB }));
          }
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static verifyFileSignature() {
    return async (req, _, next) => {
      try {
        if (!req.files || Object.keys(req.files).length === 0) {
          return next();
        }

        const files = Array.isArray(req.files) ? req.files : Object.values(req.files);

        for (const file of files) {
          const buffer = file.data || file.buffer;

          if (!buffer) {
            continue;
          }

          const signature = buffer.toString('hex', 0, 4);
          const expectedMimeType = FILE_SIGNATURE_MAP[signature];

          if (expectedMimeType && expectedMimeType !== file.mimetype) {
            logger.warn('File signature mismatch', {
              filename: file.name,
              declaredMimeType: file.mimetype,
              detectedMimeType: expectedMimeType,
              signature,
              ip: req.ip,
              accountId: req.user?.accountId,
            });
            throw boom.badRequest(i18n.__('error.file_signature_mismatch'));
          }
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static sanitizeFilename() {
    return (req, _, next) => {
      try {
        if (!req.files || Object.keys(req.files).length === 0) {
          return next();
        }

        const files = Array.isArray(req.files) ? req.files : Object.values(req.files);

        for (const file of files) {
          const originalName = file.name;
          const extension = path.extname(originalName);
          const baseName = path.basename(originalName, extension);

          const sanitizedBase = baseName
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .replace(/_{2,}/g, '_')
            .substring(0, 100);

          const timestamp = Date.now();
          const randomString = crypto.randomBytes(8).toString('hex');

          file.sanitizedName = `${sanitizedBase}_${timestamp}_${randomString}${extension}`;
          file.originalName = originalName;
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static preventPathTraversal() {
    return (req, _, next) => {
      try {
        if (!req.files || Object.keys(req.files).length === 0) {
          return next();
        }

        const files = Array.isArray(req.files) ? req.files : Object.values(req.files);
        const pathTraversalPatterns = [/\.\./g, /\//g, /\\/g];

        for (const file of files) {
          const filename = file.name || file.originalname;

          for (const pattern of pathTraversalPatterns) {
            if (pattern.test(filename)) {
              logger.warn('Path traversal attempt in filename', {
                filename,
                ip: req.ip,
                accountId: req.user?.accountId,
              });
              throw boom.badRequest(i18n.__('error.invalid_filename'));
            }
          }
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static enforceQuota(quotaMB = 100) {
    return async (req, _, next) => {
      try {
        if (!req.files || Object.keys(req.files).length === 0) {
          return next();
        }

        const accountId = req.user?.accountId;
        if (!accountId) {
          throw boom.unauthorized(i18n.__('error.authentication_required'));
        }

        const files = Array.isArray(req.files) ? req.files : Object.values(req.files);
        const totalUploadSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

        const models = require('../../models');
        const uploadedFiles =
          (await models.usrFiles?.count({
            where: { accountId },
          })) || 0;

        const currentQuotaMB = uploadedFiles * 5;

        if (currentQuotaMB + totalUploadSize / 1024 / 1024 > quotaMB) {
          logger.warn('File upload quota exceeded', {
            accountId,
            currentQuotaMB,
            uploadSizeMB: totalUploadSize / 1024 / 1024,
            quotaMB,
          });
          throw boom.forbidden(i18n.__('error.quota_exceeded'));
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static scanForMalware() {
    return async (req, _, next) => {
      try {
        if (!req.files || Object.keys(req.files).length === 0) {
          return next();
        }

        const files = Array.isArray(req.files) ? req.files : Object.values(req.files);

        for (const file of files) {
          const buffer = file.data || file.buffer;

          if (!buffer) {
            continue;
          }

          const suspiciousPatterns = [
            Buffer.from('<?php'),
            Buffer.from('<script'),
            Buffer.from('eval('),
            Buffer.from('exec('),
            Buffer.from('system('),
          ];

          for (const pattern of suspiciousPatterns) {
            if (buffer.includes(pattern)) {
              logger.error('Suspicious content detected in file', {
                filename: file.name,
                pattern: pattern.toString(),
                ip: req.ip,
                accountId: req.user?.accountId,
              });
              throw boom.badRequest(i18n.__('error.malicious_file_detected'));
            }
          }
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  static limitFileCount(maxFiles = 10) {
    return (req, _, next) => {
      try {
        if (!req.files || Object.keys(req.files).length === 0) {
          return next();
        }

        const fileCount = Array.isArray(req.files) ? req.files.length : Object.keys(req.files).length;

        if (fileCount > maxFiles) {
          logger.warn('File count limit exceeded', {
            fileCount,
            maxFiles,
            ip: req.ip,
            accountId: req.user?.accountId,
          });
          throw boom.badRequest(i18n.__('error.too_many_files', { maxFiles }));
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

module.exports = FileUploadGuard;
