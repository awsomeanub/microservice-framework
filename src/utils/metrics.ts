import client, {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';
import { config } from '../config';
import { database } from '../config/database';

const register = new Registry();

register.setDefaultLabels({
  service: 'microservice-framework',
  environment: config.nodeEnv,
});

if (config.metrics.enabled) {
  collectDefaultMetrics({ register });
}

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active HTTP connections',
  registers: [register],
});

export const dbPoolTotal = new Gauge({
  name: 'db_pool_connections_total',
  help: 'Total number of database pool connections',
  registers: [register],
});

export const dbPoolIdle = new Gauge({
  name: 'db_pool_connections_idle',
  help: 'Number of idle database pool connections',
  registers: [register],
});

export const dbPoolWaiting = new Gauge({
  name: 'db_pool_connections_waiting',
  help: 'Number of waiting database pool connections',
  registers: [register],
});

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

export function updateDbPoolMetrics(): void {
  const stats = database.getPoolStats();
  if (stats) {
    dbPoolTotal.set(stats.totalCount);
    dbPoolIdle.set(stats.idleCount);
    dbPoolWaiting.set(stats.waitingCount);
  }
}

export async function getMetrics(): Promise<string> {
  updateDbPoolMetrics();
  return register.metrics();
}

export function getContentType(): string {
  return register.contentType;
}

export { register };
