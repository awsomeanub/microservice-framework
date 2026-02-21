import { Router } from 'express';
import { itemsController } from '../controllers/items.controller';
import { validate } from '../middleware/validation';
import {
  createItemSchema,
  updateItemSchema,
  idParamSchema,
  paginationSchema,
} from '../models/item.schema';

const router = Router();

// Create a new item (proxied to item service)
router.post(
  '/',
  validate({ body: createItemSchema }),
  (req, res, next) => itemsController.create(req, res, next)
);

// Get all items with pagination
router.get(
  '/',
  validate({ query: paginationSchema }),
  (req, res, next) => itemsController.findAll(req, res, next)
);

// Get a single item by ID
router.get(
  '/:id',
  validate({ params: idParamSchema }),
  (req, res, next) => itemsController.findById(req, res, next)
);

// Update an item by ID
router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateItemSchema }),
  (req, res, next) => itemsController.update(req, res, next)
);

// Delete an item by ID
router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  (req, res, next) => itemsController.delete(req, res, next)
);

export { router as itemsRoutes };
