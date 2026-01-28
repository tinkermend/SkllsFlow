import { Registry, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

/**
 * Metrics Registry
 * Singleton registry for all Prometheus metrics
 */
const register = new Registry();

// Add default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

/**
 * Database query duration histogram
 * Tracks query latency with p50, p95, p99 percentiles
 */
export const dbQueryDuration = new Histogram({
  name: 'skillsflow_db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'table', 'status'] as const,
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

/**
 * Database connection pool gauge
 * Tracks active and idle connections
 */
export const dbPoolConnections = new Gauge({
  name: 'skillsflow_db_pool_connections',
  help: 'Database connection pool size',
  labelNames: ['state'] as const, // 'active', 'idle', 'total'
  registers: [register],
});

/**
 * Database error counter
 * Tracks error rates by type and operation
 */
export const dbErrors = new Counter({
  name: 'skillsflow_db_errors_total',
  help: 'Database error count',
  labelNames: ['error_type', 'operation'] as const,
  registers: [register],
});

/**
 * Session creation counter
 * Tracks total sessions created
 */
export const sessionsCreated = new Counter({
  name: 'skillsflow_sessions_created_total',
  help: 'Total number of sessions created',
  registers: [register],
});

/**
 * Middleware to track Prisma query metrics
 */
export const prismaMetricsMiddleware = async (params: any, next: (params: any) => Promise<any>) => {
  const start = Date.now();
  const operation = params.action;
  const model = params.model?.toLowerCase() || 'unknown';

  try {
    const result = await next(params);

    // Record successful query duration
    dbQueryDuration
      .labels(operation, model, 'success')
      .observe((Date.now() - start) / 1000);

    return result;
  } catch (error: any) {
    // Record failed query duration and error
    dbQueryDuration
      .labels(operation, model, 'error')
      .observe((Date.now() - start) / 1000);

    dbErrors
      .labels(error.code || 'unknown', operation)
      .inc();

    throw error;
  }
};

/**
 * Metrics endpoint handler
 * Returns Prometheus-formatted metrics
 */
export async function metricsEndpoint(): Promise<string> {
  return await register.metrics();
}

/**
 * Update connection pool metrics
 * Call this periodically or after operations
 */
export function updatePoolMetrics(prisma: any): void {
  // Get connection pool metrics from Prisma
  const metrics = prisma._engine?.metrics;

  if (metrics) {
    // Prisma doesn't expose detailed pool metrics by default
    // This is a placeholder for future enhancement
    dbPoolConnections.labels('total').set(1); // Placeholder
  }
}
