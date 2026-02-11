/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient({
  // Connection Pool Configuration (FR-024)
  log: import.meta.env.DEV
    ? ["query", "info", "warn", "error"]
    : ["error"],
});

// Retry logic with 100-200ms delay (FR-020)
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 1,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        // Exponential backoff with base 100ms
        const delay = 100 * Math.pow(1.5, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Operation failed after retries");
}

// Generic repository interface (FR-014)
export class BaseRepository<T> {
  protected model: any;

  constructor(model: any) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    return executeWithRetry(() => this.model.create({ data }));
  }

  async findById(id: string): Promise<T | null> {
    return executeWithRetry(() => this.model.findUnique({ where: { id } }));
  }

  async findMany(params?: any): Promise<T[]> {
    return executeWithRetry(() => this.model.findMany(params));
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return executeWithRetry(() =>
      this.model.update({
        where: { id },
        data,
      }),
    );
  }

  async delete(id: string): Promise<T> {
    return executeWithRetry(() => this.model.delete({ where: { id } }));
  }

  // Transaction support (FR-017)
  async inTransaction<R>(fn: (tx: Prisma.TransactionClient) => Promise<R>): Promise<R> {
    return prisma.$transaction(fn);
  }
}

// Export enhanced Prisma client
export { prisma, executeWithRetry };

// Example usage with a specific model
export class UserRepository extends BaseRepository<any> {
  constructor() {
    super(prisma.user);
  }

  // Custom methods specific to user operations
  async findByEmail(email: string): Promise<any | null> {
    return executeWithRetry(() => prisma.user.findUnique({ where: { email } }));
  }
}
