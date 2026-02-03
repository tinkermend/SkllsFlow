/**
 * Session Types
 * Type definitions for session management feature
 */

/**
 * Session domain model
 * 注意：userId 是数据库 ID (BigInt)，用于内部关联查询
 */
export interface Session {
  id: bigint;
  sessionId: string;
  title: string;
  chatId: bigint;
  createdBy: bigint;
  createdAt: Date;
  updatedAt?: Date;
  // 以下字段为兼容旧逻辑，实际数据存储在其他系统或通过参数传入
  projectId?: string;
  status?: "active" | "delete";
  opencodeServer?: string;
  directory?: string | null;
}

/**
 * Create session DTO (Data Transfer Object)
 * Input for creating a new session
 * Contains OpenCode session data returned from OpenCode API
 */
export interface CreateSessionDto {
  sessionId: string; // From OpenCode API (required)
  chatServerId: string; // ChatServer UUID，标识对应的智能服务
  title?: string; // From OpenCode API or client override
  projectId?: string; // From OpenCode API
  directory?: string; // From OpenCode API
}

/**
 * Session response DTO
 * Output format for API responses
 * 注意：userId 是 UUID (对外 API)，不是数据库 ID
 */
export interface SessionResponseDto {
  id: string;
  sessionId: string;
  title: string;
  userId: string; // UUID (对外 API)
  projectId: string;
  status: "active" | "delete";
  opencodeServer: string;
  directory: string | null;
  chatServerId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * OpenCode session response
 * Format returned by OpenCode API
 */
export interface OpenCodeSessionResponse {
  id: string;
  title: string;
  projectID: string;
  directory?: string;
}

/**
 * Convert Session domain model to response DTO
 * 注意：
 * 1. 返回的 id 字段应该是 OpenCode 的 sessionId (ses_xxx)，而不是数据库自增 ID
 * 2. userId 需要从数据库 ID (BigInt) 转换为 UUID (string)
 *
 * @param session - Session domain model (userId 是数据库 ID)
 * @param userUuid - User UUID (对外 API 使用)
 */
export function toSessionResponseDto(
  session: Session,
  userUuid: string,
  options?: {
    projectId?: string;
    status?: "active" | "delete";
    opencodeServer?: string;
    directory?: string | null;
    chatServerId?: string;
  }
): SessionResponseDto {
  return {
    id: session.sessionId, // 使用 OpenCode session ID 而不是数据库 ID
    sessionId: session.sessionId,
    title: session.title,
    userId: userUuid, // 使用 UUID 而不是数据库 ID
    projectId: options?.projectId ?? session.projectId ?? 'global',
    status: options?.status ?? session.status ?? 'active',
    opencodeServer: options?.opencodeServer ?? session.opencodeServer ?? '',
    directory: options?.directory ?? session.directory ?? null,
    chatServerId: options?.chatServerId,
    createdAt: (session.createdAt ?? new Date()).toISOString(),
    updatedAt: (session.updatedAt ?? session.createdAt ?? new Date()).toISOString(),
  };
}
