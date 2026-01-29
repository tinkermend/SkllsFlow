import { type PrismaClient } from '@prisma/client';
import { dbQueryDuration, dbErrors, updatePoolMetrics } from '../utils/metrics.js';

interface MiddlewareParams {
  model?: string;
  action: string;
  args: any;
  dataPath?: string[];
  runInTransaction?: boolean;
}

/**
 * Prisma Metrics Middleware
 * Tracks query latency, error rates, and connection pool metrics
 */
export function createPrismaMetricsMiddleware(prisma: PrismaClient) {
  (prisma as any).$use(async (params: MiddlewareParams, next: (params: MiddlewareParams) => Promise<any>) => {
    const start = Date.now();
    const operation = params.action;
    const model = params.model?.toLowerCase() || 'unknown';

    try {
      const result = await next(params);

      // Record successful query duration
      dbQueryDuration
        .labels(operation, model, 'success')
        .observe((Date.now() - start) / 1000);

      // Update pool metrics periodically
      updatePoolMetrics(prisma);

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
  });
}
