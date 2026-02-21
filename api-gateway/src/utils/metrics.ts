import client, {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';
import { config } from '../config';

const register = new Registry();

register.setDefaultLabels({
  service: 'api-gateway',
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

// Upstream service metrics
export const upstreamRequestsTotal = new Counter({
  name: 'upstream_requests_total',
  help: 'Total number of upstream HTTP requests',
  labelNames: ['service', 'method', 'path', 'status_code'],
  registers: [register],
});

export const upstreamRequestDuration = new Histogram({
  name: 'upstream_request_duration_seconds',
  help: 'Upstream HTTP request duration in seconds',
  labelNames: ['service', 'method', 'path', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// Retry metrics
export const retryAttemptsTotal = new Counter({
  name: 'retry_attempts_total',
  help: 'Total number of retry attempts',
  labelNames: ['service', 'attempt_number'],
  registers: [register],
});

// Circuit breaker metrics
export const circuitBreakerState = new Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=half-open, 2=open)',
  labelNames: ['service'],
  registers: [register],
});

export const circuitBreakerFailures = new Counter({
  name: 'circuit_breaker_failures_total',
  help: 'Total number of circuit breaker failures',
  labelNames: ['service'],
  registers: [register],
});

export const circuitBreakerSuccesses = new Counter({
  name: 'circuit_breaker_successes_total',
  help: 'Total number of circuit breaker successes',
  labelNames: ['service'],
  registers: [register],
});

// Connection pool metrics
export const httpConnectionPoolActive = new Gauge({
  name: 'http_connection_pool_active',
  help: 'Number of active connections in the HTTP pool',
  labelNames: ['service'],
  registers: [register],
});

export const httpConnectionPoolPending = new Gauge({
  name: 'http_connection_pool_pending',
  help: 'Number of pending connections in the HTTP pool',
  labelNames: ['service'],
  registers: [register],
});

export async function getMetrics(): Promise<string> {
  return register.metrics();
}

export function getContentType(): string {
  return register.contentType;
}

export { register };
