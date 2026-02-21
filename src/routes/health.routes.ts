import { Router, Request, Response } from 'express';
import { database } from '../config/database';

const router = Router();

// Basic health check endpoint to verify service status
router.get('/health', async (_req: Request, res: Response) => {
  // Check database connectivity
  const dbHealthy = await database.healthCheck();

  // Return health status with timestamp
  const status = dbHealthy ? 'healthy' : 'unhealthy';
  const statusCode = dbHealthy ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
  });
});

export { router as healthRoutes };
