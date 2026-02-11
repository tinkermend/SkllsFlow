/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as mcpServicesApi from '../api/mcp-services.api';
import type { McpQueryOptions, CreateMcpRequest, UpdateMcpRequest } from '../types';

/**
 * 获取我的 MCP 列表
 */
export function useMyServices(options?: McpQueryOptions) {
  return useQuery({
    queryKey: ['mcp-services', 'my', options],
    queryFn: () => mcpServicesApi.getMyServices(options),
  });
}

/**
 * 获取 MCP 服务详情
 */
export function useServiceDetail(mcpId: string) {
  return useQuery({
    queryKey: ['mcp-services', mcpId],
    queryFn: () => mcpServicesApi.getServiceDetail(mcpId),
    enabled: !!mcpId,
  });
}

/**
 * 创建 MCP 服务
 */
export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMcpRequest) => mcpServicesApi.createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp-services'] });
      toast.success('MCP 服务创建成功');
    },
    onError: (error: any) => {
      toast.error(error.message || '创建失败');
    },
  });
}

/**
 * 更新 MCP 服务
 */
export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mcpId, data }: { mcpId: string; data: UpdateMcpRequest }) =>
      mcpServicesApi.updateService(mcpId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mcp-services'] });
      queryClient.invalidateQueries({ queryKey: ['mcp-services', variables.mcpId] });
      toast.success('MCP 服务更新成功');
    },
    onError: (error: any) => {
      toast.error(error.message || '更新失败');
    },
  });
}

/**
 * 删除 MCP 服务
 */
export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mcpId: string) => mcpServicesApi.deleteService(mcpId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp-services'] });
      toast.success('MCP 服务删除成功');
    },
    onError: (error: any) => {
      toast.error(error.message || '删除失败');
    },
  });
}

/**
 * 获取 MCP 工具列表
 */
export function useTools(mcpId: string) {
  return useQuery({
    queryKey: ['mcp-services', mcpId, 'tools'],
    queryFn: () => mcpServicesApi.getTools(mcpId),
    enabled: !!mcpId,
  });
}

/**
 * 获取 MCP 资源列表
 */
export function useResources(mcpId: string) {
  return useQuery({
    queryKey: ['mcp-services', mcpId, 'resources'],
    queryFn: () => mcpServicesApi.getResources(mcpId),
    enabled: !!mcpId,
  });
}
