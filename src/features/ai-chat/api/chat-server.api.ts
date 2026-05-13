import { apiClient } from '@/lib/api-client';
import type {
  ChatServer,
  ChatServerCapabilities,
  CreateChatServerRequest,
  ChatServerDeleteStats,
} from '../types';

/**
 * 获取所有 ChatServer
 * GET /api/chat-servers
 */
export async function getAllChatServers(): Promise<ChatServer[]> {
  const response = await apiClient.get('/chat-servers');
  return response.data;
}

/**
 * 创建新的 ChatServer
 * POST /api/chat-servers
 */
export async function createChatServer(
  request: CreateChatServerRequest
): Promise<ChatServer> {
  const response = await apiClient.post('/chat-servers', request);
  return response.data;
}

/**
 * 删除 ChatServer
 * DELETE /api/chat-servers/:chatId
 */
export async function deleteChatServer(chatId: string): Promise<void> {
  await apiClient.delete(`/chat-servers/${chatId}`);
}

/**
 * 切换 ChatServer 激活状态
 * PATCH /api/chat-servers/:chatId/status
 */
export async function setChatServerStatus(
  chatId: string,
  action: 'activate' | 'deactivate'
): Promise<ChatServer> {
  const response = await apiClient.patch(`/chat-servers/${chatId}/status`, {
    action,
  });
  return response.data;
}

/**
 * 获取 ChatServer 删除统计信息
 * GET /api/chat-servers/:chatId/delete-stats
 */
export async function getChatServerDeleteStats(
  chatId: string
): Promise<ChatServerDeleteStats> {
  const response = await apiClient.get(`/chat-servers/${chatId}/delete-stats`);
  return response.data;
}

/**
 * 获取 ChatServer 已加载的 Skills 与 MCP 服务
 * GET /api/chat-servers/:chatId/capabilities
 */
export async function getChatServerCapabilities(
  chatId: string
): Promise<ChatServerCapabilities> {
  const response = await apiClient.get(`/chat-servers/${chatId}/capabilities`);
  return response.data;
}
