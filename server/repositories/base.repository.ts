import { type PrismaClient, Prisma } from '@prisma/client';

/**
 * Pagination options for findAll queries
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Paginated result with metadata
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Generic Base Repository
 * Provides common CRUD operations for all entities
 * Reduces code duplication and ensures consistent database access patterns
 *
 * @template T - The entity type (e.g., Session, User)
 * @template CreateInput - Prisma create input type
 * @template UpdateInput - Prisma update input type
 * @template WhereInput - Prisma where input type
 * @template OrderByInput - Prisma orderBy input type
 *
 * @example
 * ```typescript
 * // Extend BaseRepository for your entity
 * class SessionRepository extends BaseRepository<
 *   Session,
 *   Prisma.SessionCreateInput,
 *   Prisma.SessionUpdateInput,
 *   Prisma.SessionWhereInput,
 *   Prisma.SessionOrderByWithRelationInput
 * > {
 *   protected get modelName(): string {
 *     return 'session';
 *   }
 *
 *   // Add custom methods specific to Session
 *   async findBySessionId(sessionId: string): Promise<Session | null> {
 *     return this.prisma.session.findUnique({ where: { sessionId } });
 *   }
 * }
 *
 * // Usage
 * const repo = new SessionRepository(prisma);
 * const session = await repo.create({ sessionId: 'abc', title: 'My Session', ... });
 * const sessions = await repo.findAll({
 *   where: { status: 'ACTIVE' },
 *   orderBy: { createdAt: 'desc' },
 *   limit: 10,
 *   offset: 0,
 * });
 * ```
 */
export abstract class BaseRepository<
  T,
  CreateInput = any,
  UpdateInput = any,
  WhereInput = any,
  OrderByInput = any
> {
  constructor(protected prisma: PrismaClient) {}

  /**
   * Get the Prisma model for dynamic access
   */
  protected get model(): any {
    return (this.prisma as any)[this.modelName];
  }

  /**
   * Create a new record
   *
   * @param data - Data to create the record
   * @returns The created record
   *
   * @example
   * ```typescript
   * const session = await repository.create({
   *   sessionId: 'abc123',
   *   title: 'My Session',
   *   userId: 'user-1',
   *   status: 'ACTIVE',
   * });
   * ```
   */
  async create(data: CreateInput): Promise<T> {
    const result = await this.model.create({ data });
    return result;
  }

  /**
   * Find record by ID
   *
   * @param id - Record ID
   * @returns The record or null if not found
   *
   * @example
   * ```typescript
   * const session = await repository.findById(1);
   * if (session) {
   *   console.log('Found:', session);
   * }
   * ```
   */
  async findById(id: number | bigint): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
    });
  }

  /**
   * Find record by ID or throw error if not found
   *
   * @param id - Record ID
   * @param errorMessage - Custom error message (optional)
   * @returns The record
   * @throws Error if record not found
   *
   * @example
   * ```typescript
   * try {
   *   const session = await repository.findByIdOrThrow(1, 'Session not found');
   * } catch (error) {
   *   console.error('Session does not exist');
   * }
   * ```
   */
  async findByIdOrThrow(id: number | bigint, errorMessage?: string): Promise<T> {
    const record = await this.findById(id);
    if (!record) {
      throw new Error(errorMessage || `Record with ID ${id} not found`);
    }
    return record;
  }

  /**
   * Find all records with optional filtering, sorting, and pagination
   *
   * @param options - Query options (where, orderBy, limit, offset)
   * @returns Array of records
   *
   * @example
   * ```typescript
   * // Find all active sessions, ordered by creation date
   * const sessions = await repository.findAll({
   *   where: { status: 'ACTIVE' },
   *   orderBy: { createdAt: 'desc' },
   *   limit: 10,
   *   offset: 0,
   * });
   *
   * // Find all records without filtering
   * const all = await repository.findAll();
   * ```
   */
  async findAll(options?: {
    where?: WhereInput;
    orderBy?: OrderByInput;
  } & PaginationOptions): Promise<T[]> {
    const { where, orderBy, limit, offset } = options || {};

    return this.model.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
    });
  }

  /**
   * Find paginated records with metadata
   *
   * @param options - Query options (where, orderBy, limit, offset)
   * @returns Paginated result with data and metadata
   *
   * @example
   * ```typescript
   * const result = await repository.findPaginated({
   *   where: { status: 'ACTIVE' },
   *   orderBy: { createdAt: 'desc' },
   *   limit: 10,
   *   offset: 0,
   * });
   *
   * console.log(`Found ${result.data.length} of ${result.total} sessions`);
   * console.log(`Has more pages: ${result.hasMore}`);
   * ```
   */
  async findPaginated(options?: {
    where?: WhereInput;
    orderBy?: OrderByInput;
  } & PaginationOptions): Promise<PaginatedResult<T>> {
    const { where, orderBy, limit = 10, offset = 0 } = options || {};

    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
      }),
      this.model.count({ where }),
    ]);

    return {
      data,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Count records matching the filter criteria
   *
   * @param where - Filter criteria (optional)
   * @returns Number of matching records
   *
   * @example
   * ```typescript
   * const activeCount = await repository.count({ status: 'ACTIVE' });
   * const totalCount = await repository.count();
   * ```
   */
  async count(where?: WhereInput): Promise<number> {
    return this.model.count({ where });
  }

  /**
   * Check if any records match the filter criteria
   *
   * @param where - Filter criteria
   * @returns True if at least one record matches
   *
   * @example
   * ```typescript
   * const hasActiveSessions = await repository.exists({ status: 'ACTIVE' });
   * ```
   */
  async exists(where: WhereInput): Promise<boolean> {
    const count = await this.model.count({ where });
    return count > 0;
  }

  /**
   * Update record by ID
   *
   * @param id - Record ID
   * @param data - Data to update
   * @returns The updated record
   *
   * @example
   * ```typescript
   * const updated = await repository.update(1, {
   *   title: 'Updated Title',
   *   status: 'DELETE',
   * });
   * ```
   */
  async update(id: number | bigint, data: UpdateInput): Promise<T> {
    return this.model.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete record by ID
   *
   * @param id - Record ID
   * @returns The deleted record
   *
   * @example
   * ```typescript
   * const deleted = await repository.delete(1);
   * console.log('Deleted session:', deleted.sessionId);
   * ```
   */
  async delete(id: number | bigint): Promise<T> {
    return this.model.delete({
      where: { id },
    });
  }

  /**
   * Soft delete record by ID (update status to DELETE)
   * Only works if the model has a status field
   *
   * @param id - Record ID
   * @returns The updated record (soft deleted)
   *
   * @example
   * ```typescript
   * await repository.softDelete(1);
   * // Record is now marked as DELETE but still in database
   * ```
   */
  async softDelete(id: number | bigint): Promise<T> {
    return this.model.update({
      where: { id },
      data: { status: 'DELETE' },
    }) as Promise<T>;
  }

  /**
   * Execute operations in a transaction (FR-017 compliance)
   * All operations run within a single database transaction
   * Automatically rolls back on error
   *
   * @param callback - Transaction callback function
   * @returns Result of the callback
   *
   * @example
   * ```typescript
   * // Simple transaction
   * const result = await repository.transaction(async (tx) => {
   *   const session = await tx.session.create({ ... });
   *   await tx.sessionHistory.create({ ... });
   *   return session;
   * });
   *
   * // Multiple operations in transaction
   * await repository.transaction(async (tx) => {
   *   await tx.session.update({ where: { id: 1 }, data: { status: 'ACTIVE' } });
   *   await tx.sessionMeta.update({ where: { id: 1 }, data: { lastActive: new Date() } });
   * });
   * ```
   */
  async transaction<R>(
    callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>) => Promise<R>
  ): Promise<R> {
    return this.prisma.$transaction(callback) as Promise<R>;
  }

  /**
   * Execute multiple operations in a transaction with retry logic
   * Uses exponential backoff for transient errors
   *
   * @param callback - Transaction callback function
   * @param maxRetries - Maximum number of retry attempts (default: 1)
   * @param retryDelay - Delay between retries in ms (default: 150)
   * @returns Result of the callback
   *
   * @example
   * ```typescript
   * const result = await repository.transactionWithRetry(
   *   async (tx) => {
   *     const session = await tx.session.create({ ... });
   *     await tx.sessionHistory.create({ ... });
   *     return session;
   *   },
   *   2, // max 2 retries
   *   150 // 150ms delay
   * );
   * ```
   */
  async transactionWithRetry<R>(
    callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>) => Promise<R>,
    maxRetries: number = 1,
    retryDelay: number = 150
  ): Promise<R> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.prisma.$transaction(callback) as Promise<R>;
      } catch (error: any) {
        lastError = error;

        // Check if error is transient (connection timeout, deadlocks, etc.)
        const isTransientError =
          error.code === 'P2034' || // Connection timeout
          error.message?.includes('deadlock') ||
          error.message?.includes('timeout');

        if (!isTransientError || attempt === maxRetries) {
          throw error;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    throw lastError;
  }

  /**
   * Abstract property to be implemented by concrete repositories
   * Returns the Prisma model name for this repository
   *
   * @example
   * ```typescript
   * protected get modelName(): string {
   *   return 'session';
   * }
   * ```
   */
  protected abstract get modelName(): string;
}
