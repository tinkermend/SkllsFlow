/**
 * 技能状态枚举
 */
export enum SkillStatus {
  ONLINE = 'online',
  DISABLED = 'disabled',
}

/**
 * 技能类型
 */
export interface Skill {
  /** 技能 ID */
  id: string
  /** 技能名称 */
  name: string
  /** 技能描述 */
  description: string
  /** 技能图标 URL */
  icon: string
  /** 技能状态 */
  status: SkillStatus
  /** 创建者 */
  creator: string
  /** 创建日期 */
  createdAt: string
  /** 关联会话 ID */
  sessionId: string
  /** 技能标签 */
  tags: string[]
}

/**
 * 技能标签页类型
 */
export type SkillTab = 'my-skills' | 'platform-skills'
