// Base application error class for consistent error handling
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Error for validation failures (400 Bad Request)
export class ValidationError extends AppError {
  public readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

// Error for upstream service errors
export class UpstreamError extends AppError {
  constructor(message: string, statusCode: number, details?: unknown) {
    super(message, statusCode, 'UPSTREAM_ERROR');
  }
}
