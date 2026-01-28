import { Prisma } from '@prisma/client';

/**
 * Retry configuration
 */
const RETRY_DELAY_MS = 150;
const MAX_RETRIES = 1;

/**
 * Transient error codes that should trigger a retry
 * Based on PostgreSQL error codes
 */
const TRANSIENT_ERROR_CODES = [
  '08006', // Connection failure
  '08001', // SQL client unable to establish SQL connection
  '40001', // Serialization failure
  '40P01', // Deadlock detected
];

/**
 * Check if error is transient and should be retried
 */
function isTransientError(error: any): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return TRANSIENT_ERROR_CODES.includes(error.code);
  }

  // Retry on connection errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  return false;
}

/**
 * Retry middleware for Prisma operations
 * Retries transient errors once with 150ms delay
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && isTransientError(error)) {
      console.warn(`Transient error detected, retrying in ${RETRY_DELAY_MS}ms...`);

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));

      // Retry operation
      return withRetry(operation, retries - 1);
    }

    throw error;
  }
}

/**
 * Prisma middleware wrapper with retry logic
 */
export function createRetryMiddleware(prisma: any) {
  prisma.$use(async (params: any, next: (params: any) => Promise<any>) => {
    return withRetry(() => next(params));
  });
}
