import { Router, Request, Response } from 'express';
import { itemServiceClient } from '../clients/item-service.client';

const router = Router();

// Basic health check endpoint to verify gateway status
router.get('/health', async (_req: Request, res: Response) => {
  // Check if backend item service is reachable
  const backendHealthy = await itemServiceClient.healthCheck();

  // Return health status with timestamp
  const status = backendHealthy ? 'healthy' : 'degraded';
  const statusCode = backendHealthy ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
  });
});

export { router as healthRoutes };
