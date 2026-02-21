import { Request, Response, NextFunction } from 'express';
import {
  httpRequestsTotal,
  httpRequestDuration,
  activeConnections,
} from '../utils/metrics';
import { config } from '../config';

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!config.metrics.enabled) {
    next();
    return;
  }

  const start = process.hrtime.bigint();
  
  activeConnections.inc();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationInSeconds = Number(end - start) / 1e9;

    const path = normalizeRoutePath(req.route?.path || req.path);

    httpRequestsTotal.inc({
      method: req.method,
      path,
      status_code: res.statusCode.toString(),
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        path,
        status_code: res.statusCode.toString(),
      },
      durationInSeconds
    );

    activeConnections.dec();
  });

  next();
}

function normalizeRoutePath(path: string): string {
  return path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/\d+/g, '/:id');
}
