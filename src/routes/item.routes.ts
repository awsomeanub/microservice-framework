import { Router } from 'express';
import { itemController } from '../controllers/item.controller';
import { validate } from '../middleware/validation';
import {
  createItemSchema,
  updateItemSchema,
  idParamSchema,
  paginationSchema,
} from '../models/item.schema';

const router = Router();

// Create a new item
router.post(
  '/',
  validate({ body: createItemSchema }),
  (req, res, next) => itemController.create(req, res, next)
);

// Get all items with pagination
router.get(
  '/',
  validate({ query: paginationSchema }),
  (req, res, next) => itemController.findAll(req, res, next)
);

// Get a single item by ID
router.get(
  '/:id',
  validate({ params: idParamSchema }),
  (req, res, next) => itemController.findById(req, res, next)
);

// Update an item by ID
router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateItemSchema }),
  (req, res, next) => itemController.update(req, res, next)
);

// Delete an item by ID
router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  (req, res, next) => itemController.delete(req, res, next)
);

export { router as itemRoutes };
