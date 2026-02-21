import { Pool, Dispatcher, request, Agent } from 'undici';
import { config } from '../config';
import { logger } from '../utils/logger';
import {
  upstreamRequestsTotal,
  upstreamRequestDuration,
  httpConnectionPoolActive,
  httpConnectionPoolPending,
} from '../utils/metrics';
import { TimeoutError, UpstreamError } from '../utils/errors';

export interface HttpClientConfig {
  baseUrl: string;
  timeoutMs?: number;
  maxConnections?: number;
  keepAliveTimeoutMs?: number;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
  correlationId?: string;
  timeoutMs?: number;
}

export interface HttpResponse<T = unknown> {
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  body: T;
}

export class HttpClient {
  private readonly pool: Pool;
  private readonly agent: Agent;
  private readonly baseUrl: string;
  private readonly serviceName: string;
  private readonly defaultTimeoutMs: number;

  constructor(serviceName: string, clientConfig: HttpClientConfig) {
    this.serviceName = serviceName;
    this.baseUrl = clientConfig.baseUrl;
    this.defaultTimeoutMs = clientConfig.timeoutMs ?? config.httpClient.timeoutMs;

    this.pool = new Pool(clientConfig.baseUrl, {
      connections: clientConfig.maxConnections ?? config.httpClient.maxConnectionsPerHost,
      pipelining: 1,
      keepAliveTimeout: clientConfig.keepAliveTimeoutMs ?? config.httpClient.keepAliveTimeoutMs,
      keepAliveMaxTimeout: clientConfig.keepAliveTimeoutMs ?? config.httpClient.keepAliveTimeoutMs,
    });

    this.agent = new Agent({
      connections: config.httpClient.maxConnections,
      keepAliveTimeout: config.httpClient.keepAliveTimeoutMs,
      keepAliveMaxTimeout: config.httpClient.keepAliveTimeoutMs,
    });

    this.startPoolMetricsCollection();

    logger.info(
      {
        service: this.serviceName,
        baseUrl: this.baseUrl,
        maxConnections: clientConfig.maxConnections ?? config.httpClient.maxConnectionsPerHost,
        timeoutMs: this.defaultTimeoutMs,
      },
      `HTTP client initialized for ${this.serviceName}`
    );
  }

  private startPoolMetricsCollection(): void {
    const collectMetrics = (): void => {
      try {
        const stats = this.pool.stats;
        httpConnectionPoolActive.set({ service: this.serviceName }, stats.connected);
        httpConnectionPoolPending.set({ service: this.serviceName }, stats.pending);
      } catch {
        // Pool may be closed
      }
    };

    setInterval(collectMetrics, 5000);
    collectMetrics();
  }

  async request<T = unknown>(options: RequestOptions): Promise<HttpResponse<T>> {
    const startTime = process.hrtime.bigint();
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const url = `${this.baseUrl}${options.path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    if (options.correlationId) {
      headers['X-Correlation-ID'] = options.correlationId;
    }

    logger.debug(
      {
        correlationId: options.correlationId,
        service: this.serviceName,
        method: options.method,
        url,
        timeoutMs,
      },
      `Sending request to ${this.serviceName}`
    );

    try {
      const response = await this.pool.request({
        method: options.method,
        path: options.path,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        headersTimeout: timeoutMs,
        bodyTimeout: timeoutMs,
      });

      const responseBody = await response.body.text();
      let parsedBody: T;

      try {
        parsedBody = JSON.parse(responseBody) as T;
      } catch {
        parsedBody = responseBody as unknown as T;
      }

      const endTime = process.hrtime.bigint();
      const durationSeconds = Number(endTime - startTime) / 1e9;

      upstreamRequestsTotal.inc({
        service: this.serviceName,
        method: options.method,
        path: this.normalizePath(options.path),
        status_code: response.statusCode.toString(),
      });

      upstreamRequestDuration.observe(
        {
          service: this.serviceName,
          method: options.method,
          path: this.normalizePath(options.path),
          status_code: response.statusCode.toString(),
        },
        durationSeconds
      );

      logger.debug(
        {
          correlationId: options.correlationId,
          service: this.serviceName,
          method: options.method,
          url,
          statusCode: response.statusCode,
          durationMs: Math.round(durationSeconds * 1000),
        },
        `Response received from ${this.serviceName}`
      );

      const responseHeaders: Record<string, string | string[] | undefined> = {};
      for (const [key, value] of Object.entries(response.headers)) {
        responseHeaders[key] = value;
      }

      if (response.statusCode >= 400) {
        throw new UpstreamError(
          `Upstream service returned error`,
          response.statusCode,
          {
            service: this.serviceName,
            path: options.path,
            body: parsedBody,
          }
        );
      }

      return {
        statusCode: response.statusCode,
        headers: responseHeaders,
        body: parsedBody,
      };
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const durationSeconds = Number(endTime - startTime) / 1e9;

      if (error instanceof UpstreamError) {
        throw error;
      }

      if (
        error instanceof Error &&
        (error.message.includes('timeout') ||
          error.message.includes('UND_ERR_HEADERS_TIMEOUT') ||
          error.message.includes('UND_ERR_BODY_TIMEOUT'))
      ) {
        logger.error(
          {
            correlationId: options.correlationId,
            service: this.serviceName,
            method: options.method,
            url,
            timeoutMs,
            durationMs: Math.round(durationSeconds * 1000),
          },
          `Request to ${this.serviceName} timed out`
        );

        upstreamRequestsTotal.inc({
          service: this.serviceName,
          method: options.method,
          path: this.normalizePath(options.path),
          status_code: '504',
        });

        throw new TimeoutError(this.serviceName, timeoutMs);
      }

      logger.error(
        {
          correlationId: options.correlationId,
          service: this.serviceName,
          method: options.method,
          url,
          error: error instanceof Error ? error.message : String(error),
          durationMs: Math.round(durationSeconds * 1000),
        },
        `Request to ${this.serviceName} failed`
      );

      upstreamRequestsTotal.inc({
        service: this.serviceName,
        method: options.method,
        path: this.normalizePath(options.path),
        status_code: '500',
      });

      throw error;
    }
  }

  private normalizePath(path: string): string {
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id');
  }

  async close(): Promise<void> {
    logger.info({ service: this.serviceName }, `Closing HTTP client for ${this.serviceName}`);
    await this.pool.close();
    await this.agent.close();
  }

  getPoolStats(): { connected: number; free: number; pending: number; queued: number; running: number; size: number } {
    const stats = this.pool.stats;
    return {
      connected: stats.connected,
      free: stats.free,
      pending: stats.pending,
      queued: stats.queued,
      running: stats.running,
      size: stats.size,
    };
  }
}
