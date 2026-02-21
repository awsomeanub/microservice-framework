import { Router, Request, Response } from 'express';
import { getMetrics, getContentType } from '../utils/metrics';
import { config } from '../config';

const router = Router();

router.get('/metrics', async (_req: Request, res: Response) => {
  if (!config.metrics.enabled) {
    res.status(404).json({ message: 'Metrics are disabled' });
    return;
  }

  try {
    const metrics = await getMetrics();
    res.set('Content-Type', getContentType());
    res.send(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});

export { router as metricsRoutes };
