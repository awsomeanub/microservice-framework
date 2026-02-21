import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError, CircuitBreakerOpenError, UpstreamError, TimeoutError } from '../utils/errors';
import { logger } from '../utils/logger';
import { ErrorResponse } from '../types/api';
import { config } from '../config';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const correlationId = req.correlationId || 'unknown';

  if (err instanceof AppError) {
    const logLevel = err.statusCode >= 500 ? 'error' : 'warn';

    logger[logLevel](
      {
        correlationId,
        error: {
          name: err.name,
          message: err.message,
          code: err.code,
          statusCode: err.statusCode,
          details: err.details,
        },
        request: {
          method: req.method,
          url: req.url,
        },
      },
      err instanceof CircuitBreakerOpenError
        ? 'Circuit breaker open'
        : err instanceof TimeoutError
          ? 'Upstream timeout'
          : err instanceof UpstreamError
            ? 'Upstream error'
            : 'Application error'
    );

    const response: ErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && !config.isProduction && { details: err.details }),
      },
      correlationId,
      timestamp: new Date().toISOString(),
    };

    res.status(err.statusCode).json(response);
    return;
  }

  logger.error(
    {
      correlationId,
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
      request: {
        method: req.method,
        url: req.url,
      },
    },
    'Unhandled error'
  );

  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.isProduction
        ? 'An unexpected error occurred'
        : err.message,
    },
    correlationId,
    timestamp: new Date().toISOString(),
  };

  res.status(500).json(response);
};

export function notFoundHandler(req: Request, res: Response): void {
  const correlationId = req.correlationId || 'unknown';

  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    correlationId,
    timestamp: new Date().toISOString(),
  };

  res.status(404).json(response);
}
