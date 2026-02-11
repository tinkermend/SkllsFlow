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
 * 装载到会话
 */
export function useLoadToSessions() {
  return useMutation({
    mutationFn: ({ mcpId, sessionIds }: { mcpId: string; sessionIds: string[] }) =>
      mcpServicesApi.loadToSessions(mcpId, sessionIds),
    onSuccess: () => {
      toast.success('MCP 装载成功');
    },
    onError: (error: any) => {
      toast.error(error.message || '装载失败');
    },
  });
}

/**
 * 从会话卸载
 */
export function useUnloadFromSessions() {
  return useMutation({
    mutationFn: ({ mcpId, sessionIds }: { mcpId: string; sessionIds: string[] }) =>
      mcpServicesApi.unloadFromSessions(mcpId, sessionIds),
    onSuccess: () => {
      toast.success('MCP 卸载成功');
    },
    onError: (error: any) => {
      toast.error(error.message || '卸载失败');
    },
  });
}
