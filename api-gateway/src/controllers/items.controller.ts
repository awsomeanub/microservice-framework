import { Request, Response, NextFunction } from 'express';
import { itemServiceClient } from '../clients/item-service.client';
import { SuccessResponse } from '../types/api';
import { Item, PaginatedResponse } from '../types/item';
import { CreateItemInput, UpdateItemInput, PaginationInput } from '../models/item.schema';

export class ItemsController {
  async create(
    req: Request<unknown, unknown, CreateItemInput>,
    res: Response<SuccessResponse<Item>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const item = await itemServiceClient.createItem(req.body, req.correlationId);

      res.status(201).json({
        success: true,
        data: item,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(
    req: Request<{ id: string }>,
    res: Response<SuccessResponse<Item>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const item = await itemServiceClient.getItem(req.params.id, req.correlationId);

      res.status(200).json({
        success: true,
        data: item,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(
    req: Request<unknown, unknown, unknown, PaginationInput>,
    res: Response<SuccessResponse<PaginatedResponse<Item>>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { page, limit } = req.query;
      const result = await itemServiceClient.getItems(page, limit, req.correlationId);

      res.status(200).json({
        success: true,
        data: result,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async update(
    req: Request<{ id: string }, unknown, UpdateItemInput>,
    res: Response<SuccessResponse<Item>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const item = await itemServiceClient.updateItem(
        req.params.id,
        req.body,
        req.correlationId
      );

      res.status(200).json({
        success: true,
        data: item,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await itemServiceClient.deleteItem(req.params.id, req.correlationId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const itemsController = new ItemsController();
