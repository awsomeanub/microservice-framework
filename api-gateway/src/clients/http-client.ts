import { config } from '../config';
import { logger } from '../utils/logger';
import { UpstreamError } from '../utils/errors';

// Response type from the backend HTTP calls
export interface HttpResponse<T = unknown> {
  statusCode: number;
  body: T;
}

// Simple HTTP client for making requests to backend services
export class HttpClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.timeoutMs = config.httpClient.timeoutMs;
  }

  // Make an HTTP request to the backend service
  async request<T = unknown>(options: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    body?: unknown;
  }): Promise<HttpResponse<T>> {
    const url = `${this.baseUrl}${options.path}`;

    logger.debug(`Sending ${options.method} request to ${url}`);

    try {
      // Create abort controller for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      // Make the HTTP request using native fetch
      const response = await fetch(url, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response body as JSON
      const responseBody = await response.text();
      let parsedBody: T;
      try {
        parsedBody = JSON.parse(responseBody) as T;
      } catch {
        parsedBody = responseBody as unknown as T;
      }

      // Handle error responses from upstream
      if (!response.ok) {
        throw new UpstreamError(
          `Upstream service returned error`,
          response.status,
          parsedBody
        );
      }

      return {
        statusCode: response.status,
        body: parsedBody,
      };
    } catch (error) {
      // Re-throw upstream errors as-is
      if (error instanceof UpstreamError) {
        throw error;
      }

      logger.error(`Request to ${url} failed:`, error);
      throw error;
    }
  }
}
