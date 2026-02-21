import { Router } from 'express';
import { itemRoutes } from './item.routes';
import { healthRoutes } from './health.routes';
import { metricsRoutes } from './metrics.routes';

const router = Router();

router.use('/', healthRoutes);
router.use('/', metricsRoutes);
router.use('/api/v1/items', itemRoutes);

export { router as routes };
