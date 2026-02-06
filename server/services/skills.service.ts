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

  /**
   * 创建技能并保存文件（事务操作）
   */
  async createSkillWithFile(
    skillData: {
      skillId: string;
      name: string;
      description: string | null;
      icon: string | null;
      category: string;
      tags: string[];
      status: 'active' | 'disabled';
      sortOrder: number;
    },
    fileData: {
      fileBuffer: Buffer;
      fileName: string;
      fileSize: number;
      mimeType: string;
    },
    userUuid: string
  ): Promise<SerializableSkill> {
    // 1. 验证 skillId 唯一性
    const existingSkill = await this.repository.findBySkillId(skillData.skillId);
    if (existingSkill) {
      throw new Error('技能ID已存在');
    }

    // 2. 通过 UUID 查询用户 BigInt ID
    const prisma = DatabaseService.getInstance();
    const user = await prisma.user.findUnique({
      where: { userUUId: userUuid },
      select: { id: true },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 3. 构建完整的 skillData（添加 createdBy）
    const completeSkillData = {
      ...skillData,
      createdBy: user.id,
    };

    // 4. 调用 Repository 创建技能和文件
    const skill = await this.repository.createSkillWithFile(
      completeSkillData,
      fileData
    );

    // 5. 返回序列化后的技能对象
    return this.convertToSerializable(skill);
  }
}
