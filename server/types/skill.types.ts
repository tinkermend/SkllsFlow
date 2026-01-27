/**
 * 技能状态枚举
 */
export enum SkillStatus {
  ONLINE = 'online',
  DISABLED = 'disabled',
}

/**
 * 技能接口
 */
export interface Skill {
  id: string
  name: string
  description: string
  icon: string
  status: SkillStatus
  creator: string
  createdAt: string
  sessionId: string
  tags: string[]
}

/**
 * 创建技能请求
 */
export type CreateSkillRequest = Omit<Skill, 'id'>

/**
 * 更新技能请求
 */
export type UpdateSkillRequest = Partial<Omit<Skill, 'id'>>
