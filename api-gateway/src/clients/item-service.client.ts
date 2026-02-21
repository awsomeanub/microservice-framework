import { HttpClient } from './http-client';
import { config } from '../config';
import { logger } from '../utils/logger';
import { Item, CreateItemDto, UpdateItemDto, PaginatedResponse } from '../types/item';

// Response structure from the backend item service
interface ItemServiceResponse<T> {
  success: true;
  data: T;
}

// Client for communicating with the backend item service
class ItemServiceClient {
  private readonly httpClient: HttpClient;

  constructor() {
    // Initialize HTTP client with backend service URL
    this.httpClient = new HttpClient(config.services.itemService.url);
    logger.info(`Item service client initialized for ${config.services.itemService.url}`);
  }

  // Create a new item via the backend service
  async createItem(data: CreateItemDto): Promise<Item> {
    logger.debug('Creating item via item-service');

    const response = await this.httpClient.request<ItemServiceResponse<Item>>({
      method: 'POST',
      path: '/api/v1/items',
      body: data,
    });

    return response.body.data;
  }

  // Get a single item by ID
  async getItem(id: string): Promise<Item> {
    logger.debug(`Getting item ${id} via item-service`);

    const response = await this.httpClient.request<ItemServiceResponse<Item>>({
      method: 'GET',
      path: `/api/v1/items/${id}`,
    });

    return response.body.data;
  }

  // Get all items with pagination
  async getItems(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Item>> {
    logger.debug(`Getting items page ${page} via item-service`);

    const response = await this.httpClient.request<ItemServiceResponse<PaginatedResponse<Item>>>({
      method: 'GET',
      path: `/api/v1/items?page=${page}&limit=${limit}`,
    });

    return response.body.data;
  }

  // Update an existing item
  async updateItem(id: string, data: UpdateItemDto): Promise<Item> {
    logger.debug(`Updating item ${id} via item-service`);

    const response = await this.httpClient.request<ItemServiceResponse<Item>>({
      method: 'PUT',
      path: `/api/v1/items/${id}`,
      body: data,
    });

    return response.body.data;
  }

  // Delete an item by ID
  async deleteItem(id: string): Promise<void> {
    logger.debug(`Deleting item ${id} via item-service`);

    await this.httpClient.request({
      method: 'DELETE',
      path: `/api/v1/items/${id}`,
    });
  }

  // Check if the backend service is healthy
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.request<{ status: string }>({
        method: 'GET',
        path: '/health',
      });
      return response.statusCode === 200;
    } catch {
      return false;
    }
  }
}

export const itemServiceClient = new ItemServiceClient();
