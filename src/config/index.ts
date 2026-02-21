import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432').transform(Number),
  DB_NAME: z.string().default('microservice_db'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default(''),
  DB_POOL_MIN: z.string().default('2').transform(Number),
  DB_POOL_MAX: z.string().default('10').transform(Number),
  DB_IDLE_TIMEOUT_MS: z.string().default('30000').transform(Number),
  DB_CONNECTION_TIMEOUT_MS: z.string().default('5000').transform(Number),
  
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  
  METRICS_ENABLED: z.string().default('true').transform((val) => val === 'true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const config = {
  port: parsed.data.PORT,
  nodeEnv: parsed.data.NODE_ENV,
  isProduction: parsed.data.NODE_ENV === 'production',
  
  database: {
    host: parsed.data.DB_HOST,
    port: parsed.data.DB_PORT,
    database: parsed.data.DB_NAME,
    user: parsed.data.DB_USER,
    password: parsed.data.DB_PASSWORD,
    min: parsed.data.DB_POOL_MIN,
    max: parsed.data.DB_POOL_MAX,
    idleTimeoutMillis: parsed.data.DB_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: parsed.data.DB_CONNECTION_TIMEOUT_MS,
  },
  
  logging: {
    level: parsed.data.LOG_LEVEL,
  },
  
  metrics: {
    enabled: parsed.data.METRICS_ENABLED,
  },
};

export type Config = typeof config;
