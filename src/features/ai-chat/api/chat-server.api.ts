import { apiClient } from '@/lib/api-client';
import type { ChatServer, CreateChatServerRequest } from '../types';

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
