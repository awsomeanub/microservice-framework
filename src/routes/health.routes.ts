import { Router, Request, Response } from 'express';
import { database } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
    };
  };
}

router.get('/health', async (_req: Request, res: Response<HealthCheckResponse>) => {
  const startTime = Date.now();
  let dbStatus: 'up' | 'down' = 'down';
  let dbResponseTime: number | undefined;

  try {
    const dbStart = Date.now();
    const isHealthy = await database.healthCheck();
    dbResponseTime = Date.now() - dbStart;
    dbStatus = isHealthy ? 'up' : 'down';
  } catch (error) {
    logger.error({ error }, 'Health check: Database check failed');
    dbStatus = 'down';
  }

  const overallStatus = dbStatus === 'up' ? 'healthy' : 'unhealthy';

  const response: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    checks: {
      database: {
        status: dbStatus,
        responseTime: dbResponseTime,
      },
    },
  };

  const statusCode = overallStatus === 'healthy' ? 200 : 503;
  res.status(statusCode).json(response);
});

router.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

router.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    const isDbReady = await database.healthCheck();
    
    if (isDbReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        reason: 'Database not available',
        timestamp: new Date().toISOString(),
      });
    }
  } catch {
    res.status(503).json({
      status: 'not_ready',
      reason: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

export { router as healthRoutes };
