import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { skillsApi } from '../api/skills.api'
import type { Skill } from '../types'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Query Keys
 */
export const skillsKeys = {
  all: ['skills'] as const,
  lists: () => [...skillsKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...skillsKeys.lists(), filters] as const,
  details: () => [...skillsKeys.all, 'detail'] as const,
  detail: (id: string) => [...skillsKeys.details(), id] as const,
}

/**
 * 获取技能列表（平台技能）
 */
export function useSkills() {
  return useQuery({
    queryKey: skillsKeys.lists(),
    queryFn: () => skillsApi.getSkills(),
  })
}

/**
 * 获取当前用户的技能列表
 */
export function useMySkills() {
  return useQuery({
    queryKey: [...skillsKeys.lists(), 'my-skills'],
    queryFn: () => skillsApi.getMySkills(),
  })
}

/**
 * 获取技能详情
 */
export function useSkill(id: string) {
  return useQuery({
    queryKey: skillsKeys.detail(id),
    queryFn: () => skillsApi.getSkillById(id),
    enabled: !!id,
  })
}

/**
 * 创建技能
 */
export function useCreateSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      skillId: string
      name: string
      description: string
      icon: string
      category: string
      tags: string[]
      status: string
      sortOrder: number
      file: File
    }) => skillsApi.createSkill(data),
    onSuccess: () => {
      // 刷新技能列表
      queryClient.invalidateQueries({ queryKey: skillsKeys.lists() })
    },
  })
}

/**
 * 更新技能
 */
export function useUpdateSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Skill> }) =>
      skillsApi.updateSkill(id, data),
    onSuccess: (_, variables) => {
      // 刷新技能列表和详情
      queryClient.invalidateQueries({ queryKey: skillsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: skillsKeys.detail(variables.id) })
    },
  })
}

/**
 * 删除技能
 */
export function useDeleteSkill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => skillsApi.deleteSkill(id),
    onSuccess: () => {
      // 刷新技能列表
      queryClient.invalidateQueries({ queryKey: skillsKeys.lists() })
    },
  })
}

/**
 * 上传技能文件
 */
export function useUploadSkillFile() {
  return useMutation({
    mutationFn: (file: File) => skillsApi.uploadSkillFile(file),
  })
}

/**
 * 获取活跃的 ChatServer 列表
 */
export function useActiveChatServers() {
  const accessToken = useAuthStore((state) => state.auth.accessToken)

  return useQuery({
    queryKey: ['chat-servers', 'active'],
    queryFn: () => skillsApi.getActiveChatServers(),
    enabled: !!accessToken,
    retry: (failureCount, error) => {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status === 401
      ) {
        return false
      }

      return failureCount < 2
    },
  })
}

/**
 * 装载技能到 ChatServer
 */
export function useLoadSkill() {
  return useMutation({
    mutationFn: ({
      skillId,
      chatServerId,
    }: {
      skillId: string
      chatServerId: string
    }) => skillsApi.loadSkillToChatServer(skillId, chatServerId),
  })
}
