import { Request, Response, NextFunction } from 'express';
import { itemService } from '../services/item.service';
import { Item, PaginatedResponse } from '../types/item';
import { CreateItemInput, UpdateItemInput, PaginationInput } from '../models/item.schema';

// Controller handling HTTP requests for item CRUD operations
export class ItemController {
  // Create a new item from request body
  async create(
    req: Request<unknown, unknown, CreateItemInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const item = await itemService.create(req.body);

      // Return 201 Created with the new item data
      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get a single item by its ID
  async findById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const item = await itemService.findById(req.params.id);

      res.status(200).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all items with pagination support
  async findAll(
    req: Request<unknown, unknown, unknown, PaginationInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { page, limit } = req.query;
      const result = await itemService.findAll(page, limit);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update an existing item by ID
  async update(
    req: Request<{ id: string }, unknown, UpdateItemInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const item = await itemService.update(req.params.id, req.body);

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
      await itemService.delete(req.params.id);

      // Return 204 No Content on successful deletion
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const itemController = new ItemController();
