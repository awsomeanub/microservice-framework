import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

// Global error handler middleware for catching all errors
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle known application errors
  if (err instanceof AppError) {
    logger.warn(`${err.code}: ${err.message}`);

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        // Include validation details if available
        ...(err instanceof ValidationError && err.details && { details: err.details }),
      },
    });
    return;
  }

  // Handle unexpected errors
  logger.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};

// Handler for requests to undefined routes
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}
