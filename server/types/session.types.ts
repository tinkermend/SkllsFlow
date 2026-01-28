/**
 * Session Types
 * Type definitions for session management feature
 */

/**
 * Session domain model
 */
export interface Session {
  id: bigint;
  sessionId: string;
  title: string;
  userId: string;
  projectId: string;
  status: "active" | "delete";
  opencodeServer: string;
  directory: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create session DTO (Data Transfer Object)
 * Input for creating a new session
 * Contains OpenCode session data returned from OpenCode API
 */
export interface CreateSessionDto {
  sessionId: string; // From OpenCode API (required)
  title?: string; // From OpenCode API or client override
  projectId?: string; // From OpenCode API
  directory?: string; // From OpenCode API
}

/**
 * Session response DTO
 * Output format for API responses
 */
export interface SessionResponseDto {
  id: string;
  sessionId: string;
  title: string;
  userId: string;
  projectId: string;
  status: "active" | "delete";
  opencodeServer: string;
  directory: string | null;
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
 * 注意：返回的 id 字段应该是 OpenCode 的 sessionId (ses_xxx)，而不是数据库自增 ID
 */
export function toSessionResponseDto(session: Session): SessionResponseDto {
  return {
    id: session.sessionId, // 使用 OpenCode session ID 而不是数据库 ID
    sessionId: session.sessionId,
    title: session.title,
    userId: session.userId,
    projectId: session.projectId,
    status: session.status,
    opencodeServer: session.opencodeServer,
    directory: session.directory,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}
