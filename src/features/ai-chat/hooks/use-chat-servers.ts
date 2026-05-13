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
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || '创建失败';
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
    onError: () => {
      toast.error('删除失败');
    },
  });

  // 切换激活/离线 mutation
  const setStatusMutation = useMutation({
    mutationFn: ({
      chatId,
      action,
    }: {
      chatId: string
      action: 'activate' | 'deactivate'
    }) => chatServerApi.setChatServerStatus(chatId, action),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-servers'] });
      toast.success(variables.action === 'activate' ? '服务已激活' : '服务已离线');
    },
    onError: (error: unknown, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-servers'] });
      const err = error as { response?: { data?: { message?: string } } };
      const fallback = variables.action === 'activate' ? '激活失败' : '离线失败';
      toast.error(err.response?.data?.message || fallback);
    },
  });

  return {
    chatServers: chatServers || [],
    isLoading,
    error,
    createChatServer: (request: CreateChatServerRequest) => createMutation.mutate(request),
    deleteChatServer: (chatId: string) => deleteMutation.mutate(chatId),
    setChatServerStatus: (chatId: string, action: 'activate' | 'deactivate') =>
      setStatusMutation.mutate({ chatId, action }),
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    togglingChatId:
      setStatusMutation.isPending ? setStatusMutation.variables?.chatId : undefined,
  };
}
