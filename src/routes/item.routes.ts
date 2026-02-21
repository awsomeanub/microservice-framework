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

router.post(
  '/',
  validate({ body: createItemSchema }),
  (req, res, next) => itemController.create(req, res, next)
);

router.get(
  '/',
  validate({ query: paginationSchema }),
  (req, res, next) => itemController.findAll(req, res, next)
);

router.get(
  '/:id',
  validate({ params: idParamSchema }),
  (req, res, next) => itemController.findById(req, res, next)
);

router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateItemSchema }),
  (req, res, next) => itemController.update(req, res, next)
);

router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateItemSchema }),
  (req, res, next) => itemController.update(req, res, next)
);

router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  (req, res, next) => itemController.delete(req, res, next)
);

export { router as itemRoutes };
