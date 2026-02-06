import axios from 'axios'
import { apiClient } from '@/lib/api-client'
import { API_ENDPOINTS, getApiUrl } from '@/config/api'
import type { Skill, SessionSkill, SkillFile, ChatServer } from '../types'

/**
 * Skills API
 * 使用统一的 apiClient，自动处理认证 token
 */
export const skillsApi = {
  /**
   * 获取所有平台技能列表
   */
  async getSkills(): Promise<Skill[]> {
    const response = await apiClient.get<Skill[]>(API_ENDPOINTS.skills.list)
    return response.data
  },

  /**
   * 获取当前用户的技能列表
   */
  async getMySkills(): Promise<Skill[]> {
    const response = await apiClient.get<Skill[]>(API_ENDPOINTS.skills.mySkills)
    return response.data
  },

  /**
   * 获取技能详情
   */
  async getSkillById(id: string): Promise<Skill | null> {
    try {
      const response = await apiClient.get<Skill>(
        API_ENDPOINTS.skills.detail(id)
      )
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  /**
   * 创建技能（包含文件上传）
   */
  async createSkill(data: {
    skillId: string
    name: string
    description: string
    icon: string
    category: string
    tags: string[]
    status: string
    sortOrder: number
    file: File
  }): Promise<Skill> {
    const formData = new FormData()

    // 添加所有字段
    formData.append('skillId', data.skillId)
    formData.append('name', data.name)
    formData.append('description', data.description)
    formData.append('icon', data.icon)
    formData.append('category', data.category)
    formData.append('tags', JSON.stringify(data.tags))
    formData.append('status', data.status)
    formData.append('sortOrder', data.sortOrder.toString())
    formData.append('file', data.file)

    const response = await apiClient.post<Skill>(
      API_ENDPOINTS.skills.create,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  /**
   * 更新技能
   */
  async updateSkill(id: string, data: Partial<Skill>): Promise<Skill> {
    const response = await apiClient.patch<Skill>(
      API_ENDPOINTS.skills.update(id),
      data
    )
    return response.data
  },

  /**
   * 删除技能
   */
  async deleteSkill(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.skills.delete(id))
  },

  /**
   * 上传技能压缩包
   */
  async uploadSkillFile(file: File): Promise<{ filePath: string }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post<{ filePath: string }>(
      API_ENDPOINTS.skills.upload,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  /**
   * 获取技能关联的会话列表
   */
  async getSkillRelatedSessions(skillId: string): Promise<SessionSkill[]> {
    const response = await apiClient.get<SessionSkill[]>(
      API_ENDPOINTS.skills.relatedSessions(skillId)
    )
    return response.data
  },

  /**
   * 获取技能装载的服务器列表
   */
  async getSkillLoadedServers(skillId: string): Promise<Array<{
    chatServerId: string
    chatServerName: string
    chatDir: string
    proxyHost: string
    proxyPort: number
    openCodePort: number
  }>> {
    const response = await apiClient.get(
      API_ENDPOINTS.skills.loadedServers(skillId)
    )
    return response.data
  },

  /**
   * 获取技能文件列表
   */
  async getSkillFiles(skillId: string): Promise<SkillFile[]> {
    const response = await apiClient.get<SkillFile[]>(
      API_ENDPOINTS.skills.files(skillId)
    )
    return response.data
  },

  /**
   * 获取文件下载 URL
   */
  downloadSkillFile(skillId: string, fileId: string): string {
    return getApiUrl(API_ENDPOINTS.skills.downloadFile(skillId, fileId))
  },

  /**
   * 装载技能到 ChatServer
   */
  async loadSkillToChatServer(
    skillId: string,
    chatServerId: string
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `/api/skills/${skillId}/load`,
      { chatServerId }
    )
    return response.data
  },

  /**
   * 获取活跃的 ChatServer 列表
   */
  async getActiveChatServers(): Promise<ChatServer[]> {
    const response = await apiClient.get<ChatServer[]>('/api/chat-servers/active')
    return response.data
  },
}
