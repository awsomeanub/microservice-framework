import { Request, Response, NextFunction } from 'express';
import { itemServiceClient } from '../clients/item-service.client';
import { Item, PaginatedResponse } from '../types/item';
import { CreateItemInput, UpdateItemInput, PaginationInput } from '../models/item.schema';

// Controller handling HTTP requests by proxying to the backend item service
export class ItemsController {
  // Create a new item (forwarded to backend)
  async create(
    req: Request<unknown, unknown, CreateItemInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const item = await itemServiceClient.createItem(req.body);

      // Return 201 Created with the new item data
      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get a single item by ID
  async findById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const item = await itemServiceClient.getItem(req.params.id);

      res.status(200).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all items with pagination
  async findAll(
    req: Request<unknown, unknown, unknown, PaginationInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { page, limit } = req.query;
      const result = await itemServiceClient.getItems(page, limit);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update an item by ID
  async update(
    req: Request<{ id: string }, unknown, UpdateItemInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const item = await itemServiceClient.updateItem(req.params.id, req.body);

      res.status(200).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete an item by ID
  async delete(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await itemServiceClient.deleteItem(req.params.id);

      // Return 204 No Content on successful deletion
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const itemsController = new ItemsController();
