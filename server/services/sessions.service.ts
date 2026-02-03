import { SessionRepository } from '../repositories/sessions.repository.js';
import { UserRepository } from '../repositories/users.repository.js';
import { ChatServerRepository } from '../repositories/chat-server.repository.js';
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
  private userRepository: UserRepository;
  private chatServerRepository: ChatServerRepository;

  constructor() {
    const prisma = DatabaseService.getInstance();
    this.repository = new SessionRepository(prisma);
    this.userRepository = new UserRepository(prisma);
    this.chatServerRepository = new ChatServerRepository(prisma);
  }

  /**
   * Create a new session
   * Flow: Client calls OpenCode API first, then calls our API to save session to database
   *
   * @param userUuid - User UUID from authentication context (对外使用的 UUID)
   * @param dto - OpenCode session data (sessionId required)
   */
  async createSession(
    userUuid: string,
    dto: CreateSessionDto
  ): Promise<SessionResponseDto> {
    // Validate required fields
    if (!userUuid) {
      throw new Error('user_id is required');
    }

    if (!dto.sessionId) {
      throw new Error('sessionId is required (obtained from OpenCode API)');
    }

    // 通过 UUID 查找用户，获取数据库 ID
    const user = await this.userRepository.findByUserId(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    if (!dto.chatServerId) {
      throw new Error('chatServerId is required');
    }

    const chatServer = await this.chatServerRepository.findByChatId(dto.chatServerId);
    if (!chatServer) {
      throw new Error('ChatServer 不存在');
    }

    if (chatServer.createdBy !== user.id) {
      throw new Error('无权为该智能服务创建会话');
    }

    const title = dto.title ? this.truncateTitle(dto.title) : 'New Session';

    const sessionData = {
      sessionId: dto.sessionId,
      title,
      chatServer: {
        connect: { id: chatServer.id },
      },
      creator: {
        connect: { id: user.id },
      },
    };

    try {
      const session = await this.repository.create(sessionData);

      // Track metrics
      sessionsCreated.inc();

      return toSessionResponseDto(session, userUuid, {
        projectId: dto.projectId,
        directory: dto.directory,
        status: 'active',
        opencodeServer: env.OPENCODE_API_URL,
        chatServerId: dto.chatServerId,
      });
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
  async getSessionById(sessionId: string, userUuid: string): Promise<SessionResponseDto | null> {
    const session = await this.repository.findBySessionId(sessionId);

    if (!session) {
      return null;
    }

    // 通过 UUID 查找用户，获取数据库 ID
    const user = await this.userRepository.findByUserId(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const chatServer = await this.chatServerRepository.findById(session.chatId);
    if (!chatServer) {
      throw new Error('ChatServer not found for session');
    }

    if (chatServer.createdBy !== user.id) {
      throw new Error('Access denied: Session belongs to different user');
    }

    return toSessionResponseDto(session, userUuid, {
      projectId: 'global',
      status: 'active',
      opencodeServer: env.OPENCODE_API_URL,
      chatServerId: chatServer.chatId,
    });
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userUuid: string, chatDbId: bigint): Promise<SessionResponseDto[]> {
    // 通过 UUID 查找用户，获取数据库 ID
    const user = await this.userRepository.findByUserId(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const chatServer = await this.chatServerRepository.findById(chatDbId);
    if (!chatServer) {
      throw new Error('ChatServer not found');
    }

    if (chatServer.createdBy !== user.id) {
      throw new Error('Access denied: ChatServer belongs to different user');
    }

    const sessions = await this.repository.findByUserAndChatId(user.id, chatServer.id);

    if (sessions.length === 0) {
      return [];
    }

    return sessions.map((session) =>
      toSessionResponseDto(session, userUuid, {
        projectId: 'global',
        status: 'active',
        opencodeServer: env.OPENCODE_API_URL,
        chatServerId: chatServer.chatId,
      })
    );
  }

  /**
   * Update session metadata (e.g., title)
   */
  async updateSession(
    sessionId: string,
    userUuid: string,
    updates: { title?: string }
  ): Promise<SessionResponseDto> {
    if (!updates.title) {
      throw new Error('title is required');
    }

    const user = await this.userRepository.findByUserId(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const session = await this.repository.findBySessionIdOrThrow(sessionId);
    const chatServer = await this.chatServerRepository.findById(session.chatId);
    if (!chatServer) {
      throw new Error('ChatServer not found for session');
    }

    if (chatServer.createdBy !== user.id) {
      throw new Error('Access denied: Session belongs to different user');
    }

    const updated = await this.repository.updateBySessionId(sessionId, {
      title: this.truncateTitle(updates.title),
    });

    return toSessionResponseDto(updated, userUuid, {
      projectId: 'global',
      status: 'active',
      opencodeServer: env.OPENCODE_API_URL,
      chatServerId: chatServer.chatId,
    });
  }

  /**
   * Delete session record
   */
  async deleteSession(sessionId: string, userUuid: string): Promise<void> {
    const user = await this.userRepository.findByUserId(userUuid);
    if (!user) {
      throw new Error('User not found');
    }

    const session = await this.repository.findBySessionIdOrThrow(sessionId);
    const chatServer = await this.chatServerRepository.findById(session.chatId);
    if (!chatServer) {
      throw new Error('ChatServer not found for session');
    }

    if (chatServer.createdBy !== user.id) {
      throw new Error('Access denied: Session belongs to different user');
    }

    await this.repository.deleteBySessionId(sessionId);
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
