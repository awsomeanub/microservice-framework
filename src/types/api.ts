export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  correlationId: string;
  timestamp: string;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  correlationId: string;
  timestamp: string;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
