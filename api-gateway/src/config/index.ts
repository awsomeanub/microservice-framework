import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Backend service configuration (ECS service discovery compatible)
  ITEM_SERVICE_URL: z.string().default('http://localhost:3000'),
  
  // HTTP client configuration
  HTTP_TIMEOUT_MS: z.string().default('30000').transform(Number),
  HTTP_KEEPALIVE_TIMEOUT_MS: z.string().default('60000').transform(Number),
  HTTP_MAX_CONNECTIONS: z.string().default('100').transform(Number),
  HTTP_MAX_CONNECTIONS_PER_HOST: z.string().default('10').transform(Number),
  
  // Retry configuration
  RETRY_MAX_ATTEMPTS: z.string().default('3').transform(Number),
  RETRY_BASE_DELAY_MS: z.string().default('100').transform(Number),
  RETRY_MAX_DELAY_MS: z.string().default('5000').transform(Number),
  
  // Circuit breaker configuration
  CIRCUIT_BREAKER_THRESHOLD: z.string().default('5').transform(Number),
  CIRCUIT_BREAKER_TIMEOUT_MS: z.string().default('30000').transform(Number),
  CIRCUIT_BREAKER_RESET_TIMEOUT_MS: z.string().default('30000').transform(Number),
  
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
  
  services: {
    itemService: {
      url: parsed.data.ITEM_SERVICE_URL,
    },
  },
  
  httpClient: {
    timeoutMs: parsed.data.HTTP_TIMEOUT_MS,
    keepAliveTimeoutMs: parsed.data.HTTP_KEEPALIVE_TIMEOUT_MS,
    maxConnections: parsed.data.HTTP_MAX_CONNECTIONS,
    maxConnectionsPerHost: parsed.data.HTTP_MAX_CONNECTIONS_PER_HOST,
  },
  
  retry: {
    maxAttempts: parsed.data.RETRY_MAX_ATTEMPTS,
    baseDelayMs: parsed.data.RETRY_BASE_DELAY_MS,
    maxDelayMs: parsed.data.RETRY_MAX_DELAY_MS,
  },
  
  circuitBreaker: {
    threshold: parsed.data.CIRCUIT_BREAKER_THRESHOLD,
    timeoutMs: parsed.data.CIRCUIT_BREAKER_TIMEOUT_MS,
    resetTimeoutMs: parsed.data.CIRCUIT_BREAKER_RESET_TIMEOUT_MS,
  },
  
  logging: {
    level: parsed.data.LOG_LEVEL,
  },
  
  metrics: {
    enabled: parsed.data.METRICS_ENABLED,
  },
};

export type Config = typeof config;
