import { Router } from 'express';
import { itemsRoutes } from './items.routes';
import { healthRoutes } from './health.routes';

const router = Router();

// Mount health check endpoint
router.use('/', healthRoutes);

// Mount API routes for items proxy
router.use('/api/v1/items', itemsRoutes);

export { router as routes };
