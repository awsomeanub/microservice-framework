import { Router, Request, Response } from 'express';
import { itemServiceClient } from '../clients/item-service.client';
import { logger } from '../utils/logger';

const router = Router();

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    itemService: {
      status: 'up' | 'down';
      circuitBreaker: {
        state: string;
        failureCount: number;
      };
      connectionPool: {
        connected: number;
        pending: number;
      };
    };
  };
}

router.get('/health', async (req: Request, res: Response<HealthCheckResponse>) => {
  let itemServiceStatus: 'up' | 'down' = 'down';

  try {
    const isHealthy = await itemServiceClient.healthCheck(req.correlationId);
    itemServiceStatus = isHealthy ? 'up' : 'down';
  } catch (error) {
    logger.error({ error }, 'Health check: Item service check failed');
    itemServiceStatus = 'down';
  }

  const circuitBreakerStats = itemServiceClient.getCircuitBreakerStats();
  const poolStats = itemServiceClient.getPoolStats();

  const overallStatus = itemServiceStatus === 'up' ? 'healthy' : 'degraded';

  const response: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    checks: {
      itemService: {
        status: itemServiceStatus,
        circuitBreaker: {
          state: circuitBreakerStats.state,
          failureCount: circuitBreakerStats.failureCount,
        },
        connectionPool: {
          connected: poolStats.connected,
          pending: poolStats.pending,
        },
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

router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    const circuitBreakerStats = itemServiceClient.getCircuitBreakerStats();
    
    if (circuitBreakerStats.state === 'OPEN') {
      res.status(503).json({
        status: 'not_ready',
        reason: 'Circuit breaker is open for item-service',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const isItemServiceHealthy = await itemServiceClient.healthCheck(req.correlationId);
    
    if (isItemServiceHealthy) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        reason: 'Item service not available',
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
