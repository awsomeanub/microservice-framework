export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND', true);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string, details?: unknown) {
    super(`${service} is currently unavailable`, 503, 'SERVICE_UNAVAILABLE', true, details);
  }
}

export class CircuitBreakerOpenError extends AppError {
  constructor(service: string) {
    super(`Circuit breaker is open for ${service}`, 503, 'CIRCUIT_BREAKER_OPEN', true);
  }
}

export class UpstreamError extends AppError {
  constructor(message: string, statusCode: number, details?: unknown) {
    super(message, statusCode, 'UPSTREAM_ERROR', true, details);
  }
}

export class TimeoutError extends AppError {
  constructor(service: string, timeoutMs: number) {
    super(`Request to ${service} timed out after ${timeoutMs}ms`, 504, 'TIMEOUT_ERROR', true);
  }
}
