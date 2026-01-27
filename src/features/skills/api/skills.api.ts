import axios from 'axios'
import { API_CONFIG, API_ENDPOINTS } from '@/config/api'
import type { Skill } from '../types'

/**
 * 创建 Axios 实例
 */
const apiClient = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeout,
})

/**
 * Skills API
 * Mock 逻辑由 MSW 接管，此处只保留真实 API 调用
 */
export const skillsApi = {
  /**
   * 获取技能列表
   */
  async getSkills(): Promise<Skill[]> {
    const response = await apiClient.get<Skill[]>(API_ENDPOINTS.skills.list)
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
   * 创建技能
   */
  async createSkill(data: Omit<Skill, 'id'>): Promise<Skill> {
    const response = await apiClient.post<Skill>(
      API_ENDPOINTS.skills.create,
      data
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
}
