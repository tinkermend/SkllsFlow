import { PrismaClient, Session, Prisma } from "@prisma/client";
import { BaseRepository } from "./base.repository.js";

/**
 * Session Repository
 * Handles database operations for Session entity
 * Extends BaseRepository to leverage generic CRUD operations
 *
 * @example
 * ```typescript
 * const repo = new SessionRepository(prisma);
 *
 * // Create session
 * const session = await repo.create({
 *   sessionId: 'abc123',
 *   title: 'My Session',
 *   userId: 'user-1',
 *   status: 'active',
 *   projectId: 'global',
 *   opencodeServer: 'http://localhost:4096',
 * });
 *
 * // Find by session ID
 * const found = await repo.findBySessionId('abc123');
 *
 * // Find user sessions (uses BaseRepository.findAll)
 * const userSessions = await repo.findByUserId('user-1');
 * ```
 */
export class SessionRepository extends BaseRepository<
  Session,
  Prisma.SessionCreateInput,
  Prisma.SessionUpdateInput,
  Prisma.SessionWhereInput,
  Prisma.SessionOrderByWithRelationInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  protected get modelName(): string {
    return "session";
  }

  /**
   * Find session by session_id (application-level identifier)
   *
   * @param sessionId - The session ID from OpenCode API
   * @returns The session or null if not found
   *
   * @example
   * ```typescript
   * const session = await repository.findBySessionId('abc123');
   * if (session) {
   *   console.log('Session found:', session.title);
   * }
   * ```
   */
  async findBySessionId(sessionId: string): Promise<Session | null> {
    return this.prisma.session.findUnique({
      where: { sessionId },
    });
  }

  /**
   * Find session by session_id or throw error if not found
   * Uses findBySessionId internally (code reuse)
   *
   * @param sessionId - The session ID from OpenCode API
   * @returns The session
   * @throws Error if session not found
   *
   * @example
   * ```typescript
   * try {
   *   const session = await repository.findBySessionIdOrThrow('abc123');
   *   console.log('Session found:', session.title);
   * } catch (error) {
   *   console.error('Session not found');
   * }
   * ```
   */
  async findBySessionIdOrThrow(sessionId: string): Promise<Session> {
    const session = await this.findBySessionId(sessionId);
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }
    return session;
  }

  /**
   * Find all sessions for a specific user
   * Refactored to use BaseRepository.findAll for code reuse (T048)
   *
   * @param userId - The user ID
   * @returns Array of user sessions ordered by updatedAt desc
   *
   * @example
   * ```typescript
   * const userSessions = await repository.findByUserId('user-1');
   * console.log(`User has ${userSessions.length} active sessions`);
   * ```
   */
  async findByUserId(userId: string): Promise<Session[]> {
    return this.findAll({
      where: {
        userId,
        status: "active",
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  /**
   * Find paginated user sessions with metadata
   * Uses BaseRepository.findPaginated for pagination support
   *
   * @param userId - The user ID
   * @param options - Pagination options (limit, offset)
   * @returns Paginated result with data and metadata
   *
   * @example
   * ```typescript
   * const result = await repository.findUserSessionsPaginated('user-1', {
   *   limit: 10,
   *   offset: 0,
   * });
   *
   * console.log(`Found ${result.data.length} of ${result.total} sessions`);
   * console.log('Has more pages:', result.hasMore);
   * ```
   */
  async findUserSessionsPaginated(
    userId: string,
    options?: { limit?: number; offset?: number }
  ) {
    return this.findPaginated({
      where: {
        userId,
        status: "active",
      },
      orderBy: {
        updatedAt: "desc",
      },
      ...options,
    });
  }

  /**
   * Check if session_id exists
   * Refactored to use BaseRepository.exists for code reuse (T048)
   *
   * @param sessionId - The session ID from OpenCode API
   * @returns True if session exists
   *
   * @example
   * ```typescript
   * const exists = await repository.existsBySessionId('abc123');
   * if (exists) {
   *   console.log('Session already exists');
   * }
   * ```
   */
  async existsBySessionId(sessionId: string): Promise<boolean> {
    return this.exists({ sessionId });
  }

  /**
   * Count active sessions for a user
   * Uses BaseRepository.count for code reuse
   *
   * @param userId - The user ID
   * @returns Number of active sessions
   *
   * @example
   * ```typescript
   * const count = await repository.countActiveByUser('user-1');
   * console.log(`User has ${count} active sessions`);
   * ```
   */
  async countActiveByUser(userId: string): Promise<number> {
    return this.count({
      userId,
      status: "active",
    });
  }

  /**
   * Soft delete a session by session_id (mark as DELETE)
   * Uses BaseRepository.softDelete if we have the ID, otherwise custom logic
   *
   * @param sessionId - The session ID from OpenCode API
   * @returns The updated session
   *
   * @example
   * ```typescript
   * const deleted = await repository.softDeleteBySessionId('abc123');
   * console.log('Session soft deleted:', deleted.status === 'DELETE');
   * ```
   */
  async softDeleteBySessionId(sessionId: string): Promise<Session> {
    return this.prisma.session.update({
      where: { sessionId },
      data: { status: "delete" },
    });
  }
}
