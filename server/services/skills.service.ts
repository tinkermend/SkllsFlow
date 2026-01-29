import { DatabaseService } from './database.service.js';
import { SkillsRepository } from '../repositories/skills.repository.js';
import { type Skill } from '@prisma/client';

/**
 * 可序列化的技能类型（BigInt 转换为 number）
 */
export interface SerializableSkill extends Omit<Skill, 'id' | 'createdBy' | 'updatedBy'> {
  id: number;
  createdBy: number;
  updatedBy: number | null;
}

/**
 * Skills Service
 * 处理技能相关的业务逻辑
 */
export class SkillsService {
  private repository: SkillsRepository;

  constructor() {
    const prisma = DatabaseService.getInstance();
    this.repository = new SkillsRepository(prisma);
  }

  /**
   * 将 Prisma Skill 对象转换为可序列化的格式
   * 将 BigInt 字段转换为 number
   */
  private convertToSerializable(skill: Skill): SerializableSkill {
    return {
      ...skill,
      id: Number(skill.id),
      createdBy: Number(skill.createdBy),
      updatedBy: skill.updatedBy ? Number(skill.updatedBy) : null,
    };
  }

  /**
   * 获取所有平台技能
   */
  async getAllPlatformSkills(): Promise<SerializableSkill[]> {
    const skills = await this.repository.findAllPlatformSkills();
    return skills.map(skill => this.convertToSerializable(skill));
  }

  /**
   * 获取用户的技能列表（通过 BigInt ID）
   */
  async getUserSkills(userId: bigint): Promise<SerializableSkill[]> {
    const skills = await this.repository.findUserSkills(userId);
    return skills.map(skill => this.convertToSerializable(skill));
  }

  /**
   * 获取用户的技能列表（通过 UUID）
   */
  async getUserSkillsByUuid(userUuid: string): Promise<SerializableSkill[]> {
    const skills = await this.repository.findUserSkillsByUuid(userUuid);
    return skills.map(skill => this.convertToSerializable(skill));
  }

  /**
   * 获取技能关联的会话列表
   */
  async getSkillRelatedSessions(skillId: string): Promise<Array<{
    sessionId: string;
    sessionTitle: string;
    createdAt: string;
  }>> {
    const sessions = await this.repository.findSkillRelatedSessions(skillId);

    // 转换日期格式为 ISO 字符串
    return sessions.map(session => ({
      sessionId: session.sessionId,
      sessionTitle: session.sessionTitle,
      createdAt: session.createdAt.toISOString(),
    }));
  }
}
