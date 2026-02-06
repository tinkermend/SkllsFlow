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
  chatId: string  // 改为 chatId，关联 chat_servers 表
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

/**
 * 技能文件信息
 */
export interface SkillFileInfo {
  id: string;
  fileName: string;
  fileSize: string; // BigInt 序列化为 string
  mimeType: string;
  createdAt: string;
}

/**
 * 可序列化的技能类型（包含创建者信息）
 */
export interface SerializableSkillWithCreator {
  id: number;
  skillId: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string;
  tags: string[];
  status: 'active' | 'disabled';
  sortOrder: number;
  createdBy: number;
  createdAt: string;
  updatedBy: number | null;
  updatedAt: string;
  creatorName: string | null; // 从 users 表关联
}
