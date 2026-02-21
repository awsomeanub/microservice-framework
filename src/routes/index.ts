import { Router } from 'express';
import { itemRoutes } from './item.routes';
import { healthRoutes } from './health.routes';

const router = Router();

// Mount health check endpoint
router.use('/', healthRoutes);

// Mount CRUD API routes for items
router.use('/api/v1/items', itemRoutes);

export { router as routes };
