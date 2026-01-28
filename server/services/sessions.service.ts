import { session_status } from '@prisma/client';
import { SessionRepository } from '../repositories/sessions.repository.js';
import { DatabaseService } from './database.service.js';
import {
  toSessionResponseDto,
  type CreateSessionDto,
  type SessionResponseDto,
} from '../types/session.types.js';
import { sessionsCreated } from '../utils/metrics.js';
import { env } from '../config/env.js';

/**
 * Sessions Service
 * Business logic for session management
 * Integrates with OpenCode API and persists to database
 */
export class SessionsService {
  private repository: SessionRepository;

  constructor() {
    const prisma = DatabaseService.getInstance();
    this.repository = new SessionRepository(prisma);
  }

  /**
   * Create a new session
   * Flow: Client calls OpenCode API first, then calls our API to save session to database
   *
   * @param userId - User ID from authentication context
   * @param dto - OpenCode session data (sessionId required)
   */
  async createSession(
    userId: string,
    dto: CreateSessionDto
  ): Promise<SessionResponseDto> {
    // Validate required fields
    if (!userId) {
      throw new Error('user_id is required');
    }

    if (!dto.sessionId) {
      throw new Error('sessionId is required (obtained from OpenCode API)');
    }

    // Prepare session data for database
    const title = dto.title ? this.truncateTitle(dto.title) : 'New Session';

    const sessionData = {
      sessionId: dto.sessionId,
      title: title,
      userId: userId,
      projectId: dto.projectId || 'global',
      status: session_status.active,
      opencodeServer: env.OPENCODE_API_URL,
      directory: dto.directory || null,
    };

    try {
      const session = await this.repository.create(sessionData);

      // Track metrics
      sessionsCreated.inc();

      return toSessionResponseDto(session);
    } catch (error: unknown) {

      // Handle duplicate session_id (P2002 = unique constraint violation)
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        throw new Error(
          `Session with ID ${dto.sessionId} already exists`
        );
      }
      throw error;
    }
  }

  /**
   * Get session by session_id
   */
  async getSessionById(sessionId: string, userId: string): Promise<SessionResponseDto | null> {
    const session = await this.repository.findBySessionId(sessionId);

    if (!session) {
      return null;
    }

    // Verify user owns this session
    if (session.userId !== userId) {
      throw new Error('Access denied: Session belongs to different user');
    }

    return toSessionResponseDto(session);
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionResponseDto[]> {
    const sessions = await this.repository.findByUserId(userId);
    return sessions.map(toSessionResponseDto);
  }


  /**
   * Truncate title to max 200 characters per FR-009
   */
  private truncateTitle(title: string): string {
    if (title.length > 200) {
      return title.substring(0, 200);
    }
    return title;
  }
}
