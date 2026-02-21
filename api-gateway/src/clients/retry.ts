import { config } from '../config';
import { logger } from '../utils/logger';
import { retryAttemptsTotal } from '../utils/metrics';

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export interface RetryContext {
  attempt: number;
  correlationId?: string;
  service?: string;
}

const defaultShouldRetry = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const statusCode = (error as { statusCode: number }).statusCode;
    return statusCode >= 500 || statusCode === 429 || statusCode === 408;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      message.includes('etimedout') ||
      message.includes('socket hang up') ||
      message.includes('network')
    );
  }
  return false;
};

function calculateBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, maxDelayMs);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: (context: RetryContext) => Promise<T>,
  retryConfig?: Partial<RetryConfig>,
  context?: { correlationId?: string; service?: string }
): Promise<T> {
  const cfg: RetryConfig = {
    maxAttempts: retryConfig?.maxAttempts ?? config.retry.maxAttempts,
    baseDelayMs: retryConfig?.baseDelayMs ?? config.retry.baseDelayMs,
    maxDelayMs: retryConfig?.maxDelayMs ?? config.retry.maxDelayMs,
    shouldRetry: retryConfig?.shouldRetry ?? defaultShouldRetry,
  };

  let lastError: unknown;

  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    const retryContext: RetryContext = {
      attempt,
      correlationId: context?.correlationId,
      service: context?.service,
    };

    try {
      return await fn(retryContext);
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === cfg.maxAttempts;
      const shouldRetry = cfg.shouldRetry(error, attempt);

      if (context?.service) {
        retryAttemptsTotal.inc({
          service: context.service,
          attempt_number: attempt.toString(),
        });
      }

      if (!shouldRetry || isLastAttempt) {
        logger.warn(
          {
            correlationId: context?.correlationId,
            service: context?.service,
            attempt,
            maxAttempts: cfg.maxAttempts,
            error: error instanceof Error ? error.message : String(error),
            willRetry: false,
          },
          `Request failed on attempt ${attempt}/${cfg.maxAttempts}, not retrying`
        );
        throw error;
      }

      const delay = calculateBackoffDelay(attempt, cfg.baseDelayMs, cfg.maxDelayMs);

      logger.info(
        {
          correlationId: context?.correlationId,
          service: context?.service,
          attempt,
          maxAttempts: cfg.maxAttempts,
          delay,
          error: error instanceof Error ? error.message : String(error),
        },
        `Request failed on attempt ${attempt}/${cfg.maxAttempts}, retrying in ${delay}ms`
      );

      await sleep(delay);
    }
  }

  throw lastError;
}
