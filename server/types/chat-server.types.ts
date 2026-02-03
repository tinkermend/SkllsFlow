import type { ChatServer } from '@prisma/client';
import { serializeBigInt } from '../utils/bigint-serializer.js';

export type ChatServerHealthStatus = 'healthy' | 'unhealthy' | 'unknown';

/**
 * 创建 ChatServer 请求 DTO
 */
export interface CreateChatServerDto {
  name: string; // 最长 16 字符
}

/**
 * ChatServer 响应 DTO
 * 所有 BigInt 字段已序列化为 string
 */
export interface ChatServerResponseDto {
  id: string; // BigInt 序列化为 string
  chatId: string; // UUID
  name: string;
  chatDir: string;
  proxyId: string; // BigInt 序列化为 string
  host: string;
  port: number;
  auth: boolean;
  authPassword: string;
  status: string;
  errorMessage: string | null;
  createdAt: string; // ISO 8601
  createdBy: string; // BigInt 序列化为 string
  healthStatus?: ChatServerHealthStatus;
  healthVersion?: string;
  healthCheckedAt?: string;
}

/**
 * 将 ChatServer 实体转换为响应 DTO
 *
 * @param chatServer - ChatServer 实体（包含 BigInt 字段）
 * @returns 序列化后的 DTO（BigInt 转为 string）
 */
export function toChatServerResponseDto(
  chatServer: ChatServer
): ChatServerResponseDto {
  return serializeBigInt(chatServer) as ChatServerResponseDto;
}
