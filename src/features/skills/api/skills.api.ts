import axios from 'axios'
import { API_CONFIG, API_ENDPOINTS } from '@/config/api'
import type { Skill } from '../types'
import { mockSkills } from '../mock-data'

/**
 * 创建 Axios 实例
 */
const apiClient = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeout,
})

/**
 * Mock API 实现
 */
const mockApi = {
  /**
   * 获取技能列表
   */
  async getSkills(): Promise<Skill[]> {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 300))
    return mockSkills
  },

  /**
   * 获取技能详情
   */
  async getSkillById(id: string): Promise<Skill | null> {
    await new Promise((resolve) => setTimeout(resolve, 200))
    return mockSkills.find((skill) => skill.id === id) || null
  },

  /**
   * 创建技能
   */
  async createSkill(data: Omit<Skill, 'id'>): Promise<Skill> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const newSkill: Skill = {
      ...data,
      id: `skill_${Date.now()}`,
    }
    return newSkill
  },

  /**
   * 更新技能
   */
  async updateSkill(id: string, data: Partial<Skill>): Promise<Skill> {
    await new Promise((resolve) => setTimeout(resolve, 400))
    const skill = mockSkills.find((s) => s.id === id)
    if (!skill) {
      throw new Error('Skill not found')
    }
    return { ...skill, ...data }
  },

  /**
   * 删除技能
   */
  async deleteSkill(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const skill = mockSkills.find((s) => s.id === id)
    if (!skill) {
      throw new Error('Skill not found')
    }
  },
}

/**
 * 真实 API 实现
 */
const realApi = {
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

/**
 * 统一的 API 接口
 * 根据配置自动切换 Mock 或真实 API
 */
export const skillsApi = API_CONFIG.useMockApi ? mockApi : realApi
