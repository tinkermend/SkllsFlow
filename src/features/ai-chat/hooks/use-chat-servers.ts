import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as chatServerApi from '../api/chat-server.api';
import type { CreateChatServerRequest } from '../types';

/**
 * ChatServer 管理 Hook
 * 提供 ChatServer 的查询、创建和删除功能
 */
export function useChatServers() {
  const queryClient = useQueryClient();

  // 查询所有 ChatServer
  const {
    data: chatServers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['chat-servers'],
    queryFn: chatServerApi.getAllChatServers,
    refetchInterval: 60000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
  });

  // 创建 ChatServer mutation
  const createMutation = useMutation({
    mutationFn: chatServerApi.createChatServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-servers'] });
      toast.success('服务启动成功');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '创建失败';
      toast.error(message);
    },
  });

  // 删除 ChatServer mutation
  const deleteMutation = useMutation({
    mutationFn: chatServerApi.deleteChatServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-servers'] });
      toast.success('服务已删除');
    },
    onError: (error: any) => {
      toast.error('删除失败');
    },
  });

  return {
    chatServers: chatServers || [],
    isLoading,
    error,
    createChatServer: (request: CreateChatServerRequest) => createMutation.mutate(request),
    deleteChatServer: (chatId: string) => deleteMutation.mutate(chatId),
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
