const { z } = require('zod');

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test', 'local', 'staging']).default('development'),
  PORT: z.coerce.number().default(8080),
  BASE_URL: z.string().url().default('http://localhost:8080'),
  API_VERSION: z.string().default('v1'),

  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(3306),
  DB_NAME: z.string().min(1, 'DB_NAME is required'),
  DB_USERNAME: z.string().min(1, 'DB_USERNAME is required'),
  DB_PASSWORD: z.string().optional(),
  DB_DIALECT: z.enum(['mysql', 'postgres', 'sqlite', 'mariadb', 'mssql']).default('mysql'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_SESSION_SECRET: z.string().min(1, 'JWT_SESSION_SECRET is required'),
  JWT_REFRESH_SESSION_SECRET: z.string().min(1, 'JWT_REFRESH_SESSION_SECRET is required'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

module.exports = { environmentSchema };
