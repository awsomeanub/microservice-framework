import { Router } from 'express';
import { itemsRoutes } from './items.routes';
import { healthRoutes } from './health.routes';
import { metricsRoutes } from './metrics.routes';

const router = Router();

router.use('/', healthRoutes);
router.use('/', metricsRoutes);
router.use('/api/v1/items', itemsRoutes);

export { router as routes };
