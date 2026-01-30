import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as mcpTagsApi from '../api/mcp-tags.api';

/**
 * 获取标签列表
 */
export function useTags(search?: string) {
  return useQuery({
    queryKey: ['mcp-tags', search],
    queryFn: () => mcpTagsApi.getTags(search),
  });
}

/**
 * 创建标签
 */
export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; color?: string }) => mcpTagsApi.createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp-tags'] });
      toast.success('标签创建成功');
    },
    onError: (error: any) => {
      toast.error(error.message || '创建失败');
    },
  });
}
