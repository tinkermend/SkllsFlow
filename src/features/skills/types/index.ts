/**
 * 技能状态枚举（匹配数据库 skill_status 枚举）
 */
export enum SkillStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

/**
 * 技能类型（匹配数据库 skills 表结构）
 */
export interface Skill {
  /** 主键：数据库内部使用 */
  id: number
  /** 技能ID：唯一标识一个技能 */
  skillId: string
  /** 技能名称 */
  name: string
  /** 技能描述 */
  description: string | null
  /** 图标样式 */
  icon: string | null
  /** 技能分类：如 code-analysis, data-processing */
  category: string
  /** 技能标签数组 */
  tags: string[]
  /** 状态：active（启用）, disabled（禁用） */
  status: SkillStatus
  /** 排序值：数字越小越靠前 */
  sortOrder: number
  /** 技能压缩包文件路径 */
  filePath: string
  /** 创建人ID */
  createdBy: number
  /** 创建时间 */
  createdAt: string
  /** 更新人ID */
  updatedBy?: number | null
  /** 更新时间 */
  updatedAt: string
  /** 关联会话 ID（前端使用，非数据库字段） */
  sessionId?: string
}

/**
 * 技能关联会话信息
 */
export interface SessionSkill {
  /** 会话ID */
  sessionId: string
  /** 会话标题 */
  sessionTitle: string
  /** 关联创建时间 */
  createdAt: string
}

/**
 * 技能标签页类型
 */
export type SkillTab = 'my-skills' | 'platform-skills'
