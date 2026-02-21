import { HttpClient, HttpResponse } from './http-client';
import { CircuitBreaker } from './circuit-breaker';
import { withRetry } from './retry';
import { config } from '../config';
import { logger } from '../utils/logger';
import { Item, CreateItemDto, UpdateItemDto, PaginatedResponse } from '../types/item';
import { SuccessResponse } from '../types/api';

interface ItemServiceResponse<T> {
  success: true;
  data: T;
  correlationId: string;
  timestamp: string;
}

class ItemServiceClient {
  private readonly httpClient: HttpClient;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly serviceName = 'item-service';
  private isInitialized = false;

  constructor() {
    this.httpClient = new HttpClient(this.serviceName, {
      baseUrl: config.services.itemService.url,
      timeoutMs: config.httpClient.timeoutMs,
      maxConnections: config.httpClient.maxConnectionsPerHost,
      keepAliveTimeoutMs: config.httpClient.keepAliveTimeoutMs,
    });

    this.circuitBreaker = new CircuitBreaker(this.serviceName, {
      threshold: config.circuitBreaker.threshold,
      timeoutMs: config.circuitBreaker.timeoutMs,
      resetTimeoutMs: config.circuitBreaker.resetTimeoutMs,
    });

    this.isInitialized = true;
    logger.info({ service: this.serviceName }, `${this.serviceName} client initialized`);
  }

  private async executeWithResilience<T>(
    operation: () => Promise<HttpResponse<ItemServiceResponse<T>>>,
    correlationId?: string
  ): Promise<T> {
    const response = await this.circuitBreaker.execute(async () => {
      return await withRetry(
        async () => await operation(),
        {
          maxAttempts: config.retry.maxAttempts,
          baseDelayMs: config.retry.baseDelayMs,
          maxDelayMs: config.retry.maxDelayMs,
        },
        {
          correlationId,
          service: this.serviceName,
        }
      );
    });

    return response.body.data;
  }

  async createItem(data: CreateItemDto, correlationId?: string): Promise<Item> {
    logger.debug(
      { correlationId, operation: 'createItem', data },
      'Creating item via item-service'
    );

    return this.executeWithResilience<Item>(
      () =>
        this.httpClient.request<ItemServiceResponse<Item>>({
          method: 'POST',
          path: '/api/v1/items',
          body: data,
          correlationId,
        }),
      correlationId
    );
  }

  async getItem(id: string, correlationId?: string): Promise<Item> {
    logger.debug(
      { correlationId, operation: 'getItem', id },
      'Getting item via item-service'
    );

    return this.executeWithResilience<Item>(
      () =>
        this.httpClient.request<ItemServiceResponse<Item>>({
          method: 'GET',
          path: `/api/v1/items/${id}`,
          correlationId,
        }),
      correlationId
    );
  }

  async getItems(
    page: number = 1,
    limit: number = 10,
    correlationId?: string
  ): Promise<PaginatedResponse<Item>> {
    logger.debug(
      { correlationId, operation: 'getItems', page, limit },
      'Getting items via item-service'
    );

    return this.executeWithResilience<PaginatedResponse<Item>>(
      () =>
        this.httpClient.request<ItemServiceResponse<PaginatedResponse<Item>>>({
          method: 'GET',
          path: `/api/v1/items?page=${page}&limit=${limit}`,
          correlationId,
        }),
      correlationId
    );
  }

  async updateItem(
    id: string,
    data: UpdateItemDto,
    correlationId?: string
  ): Promise<Item> {
    logger.debug(
      { correlationId, operation: 'updateItem', id, data },
      'Updating item via item-service'
    );

    return this.executeWithResilience<Item>(
      () =>
        this.httpClient.request<ItemServiceResponse<Item>>({
          method: 'PUT',
          path: `/api/v1/items/${id}`,
          body: data,
          correlationId,
        }),
      correlationId
    );
  }

  async deleteItem(id: string, correlationId?: string): Promise<void> {
    logger.debug(
      { correlationId, operation: 'deleteItem', id },
      'Deleting item via item-service'
    );

    await this.circuitBreaker.execute(async () => {
      return await withRetry(
        async () => {
          await this.httpClient.request({
            method: 'DELETE',
            path: `/api/v1/items/${id}`,
            correlationId,
          });
        },
        {
          maxAttempts: config.retry.maxAttempts,
          baseDelayMs: config.retry.baseDelayMs,
          maxDelayMs: config.retry.maxDelayMs,
        },
        {
          correlationId,
          service: this.serviceName,
        }
      );
    });
  }

  async healthCheck(correlationId?: string): Promise<boolean> {
    try {
      const response = await this.httpClient.request<{ status: string }>({
        method: 'GET',
        path: '/health/live',
        correlationId,
        timeoutMs: 5000,
      });
      return response.statusCode === 200;
    } catch {
      return false;
    }
  }

  getCircuitBreakerStats(): {
    state: string;
    failureCount: number;
    successCount: number;
    lastFailureTime: number;
  } {
    return this.circuitBreaker.getStats();
  }

  getPoolStats(): { connected: number; free: number; pending: number; queued: number; running: number; size: number } {
    return this.httpClient.getPoolStats();
  }

  async close(): Promise<void> {
    await this.httpClient.close();
  }
}

export const itemServiceClient = new ItemServiceClient();
