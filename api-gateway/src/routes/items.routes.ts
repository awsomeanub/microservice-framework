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

router.post(
  '/',
  validate({ body: createItemSchema }),
  (req, res, next) => itemsController.create(req, res, next)
);

router.get(
  '/',
  validate({ query: paginationSchema }),
  (req, res, next) => itemsController.findAll(req, res, next)
);

router.get(
  '/:id',
  validate({ params: idParamSchema }),
  (req, res, next) => itemsController.findById(req, res, next)
);

router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateItemSchema }),
  (req, res, next) => itemsController.update(req, res, next)
);

router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateItemSchema }),
  (req, res, next) => itemsController.update(req, res, next)
);

router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  (req, res, next) => itemsController.delete(req, res, next)
);

export { router as itemsRoutes };
