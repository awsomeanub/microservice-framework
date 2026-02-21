import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Validate environment variables with basic required settings
const envSchema = z.object({
  PORT: z.string().default('3001').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Backend service URL for the item service
  ITEM_SERVICE_URL: z.string().default('http://localhost:3000'),
  
  // HTTP request timeout
  HTTP_TIMEOUT_MS: z.string().default('30000').transform(Number),
  
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

// Export configuration object with application settings
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
  },
  
  logging: {
    level: parsed.data.LOG_LEVEL,
  },
};

export type Config = typeof config;
