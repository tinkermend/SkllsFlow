/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as mcpServicesApi from '../api/mcp-services.api';

/**
 * 健康检查
 */
export function useHealthCheck() {
  return useMutation({
    mutationFn: (mcpId: string) => mcpServicesApi.healthCheck(mcpId),
    onSuccess: (data) => {
      if (data.data.status === 'healthy') {
        toast.success('服务运行正常');
      } else {
        toast.error('服务异常');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || '健康检查失败');
    },
  });
}

/**
 * 重启服务
 */
export function useRestartService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mcpId: string) => mcpServicesApi.restartService(mcpId),
    onSuccess: (_, mcpId) => {
      queryClient.invalidateQueries({ queryKey: ['mcp-services', mcpId] });
      toast.success('服务重启成功');
    },
    onError: (error: any) => {
      toast.error(error.message || '重启失败');
    },
  });
}

/**
 * 装载到 ChatServer
 */
export function useLoadToChatServers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mcpId, chatIds }: { mcpId: string; chatIds: string[] }) =>
      mcpServicesApi.loadToChatServers(mcpId, chatIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-server-capabilities'] });
      toast.success('MCP 装载成功');
    },
    onError: (error: any) => {
      toast.error(error.message || '装载失败');
    },
  });
}

/**
 * 从 ChatServer 卸载
 */
export function useUnloadFromChatServers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mcpId, chatIds }: { mcpId: string; chatIds: string[] }) =>
      mcpServicesApi.unloadFromChatServers(mcpId, chatIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-server-capabilities'] });
      toast.success('MCP 卸载成功');
    },
    onError: (error: any) => {
      toast.error(error.message || '卸载失败');
    },
  });
}
