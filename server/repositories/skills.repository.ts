import { PrismaClient, type Prisma, type Skill } from '@prisma/client';
import { BaseRepository } from './base.repository';

/**
 * 技能 Repository
 * 提供技能相关的数据库操作
 */
export class SkillsRepository extends BaseRepository<
  Skill,
  Prisma.SkillCreateInput,
  Prisma.SkillUpdateInput,
  Prisma.SkillWhereInput,
  Prisma.SkillOrderByWithRelationInput
> {
  protected get modelName(): string {
    return 'skill';
  }

  /**
   * 根据 skillId 查找技能
   */
  async findBySkillId(skillId: string): Promise<Skill | null> {
    return this.prisma.skill.findUnique({
      where: { skillId },
    });
  }

  /**
   * 获取所有平台技能（按排序和状态）
   */
  async findAllPlatformSkills(): Promise<Skill[]> {
    return this.prisma.skill.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * 获取用户的技能列表（通过 user_skill 关联）
   * @param userId - 用户 ID (BigInt)
   */
  async findUserSkills(userId: bigint): Promise<Skill[]> {
    const userSkills = await this.prisma.userSkill.findMany({
      where: { userId },
      include: {
        skill: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return userSkills.map(us => us.skill);
  }

  /**
   * 获取用户的技能列表（通过 UUID）
   * @param userUuid - 用户 UUID
   */
  async findUserSkillsByUuid(userUuid: string): Promise<Skill[]> {
    // 第一步：通过 UUID 查找用户，获取内部 ID
    const user = await this.prisma.user.findUnique({
      where: { userUUId: userUuid },
      select: { id: true },
    });

    if (!user) {
      return [];
    }

    // 第二步：使用内部 ID 查询用户技能
    const userSkills = await this.prisma.userSkill.findMany({
      where: { userId: user.id },
      include: {
        skill: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return userSkills.map(us => us.skill);
  }

  /**
   * 创建技能并保存文件（使用事务）
   * @param skillData - 技能数据
   * @param fileData - 文件数据
   */
  async createSkillWithFile(
    skillData: Prisma.SkillCreateInput,
    fileData: {
      fileBuffer: Buffer;
      fileName: string;
      fileSize: number;
      mimeType: string;
    }
  ): Promise<Skill> {
    return this.prisma.$transaction(async (tx) => {
      // 1. 创建 skill 记录
      const skill = await tx.skill.create({
        data: skillData,
      });

      // 2. 创建 skillFile 记录
      await tx.skillFile.create({
        data: {
          skillId: skill.id,
          fileData: fileData.fileBuffer,
          fileName: fileData.fileName,
          fileSize: BigInt(fileData.fileSize),
          mimeType: fileData.mimeType,
        },
      });

      // 3. 返回 skill 对象
      return skill;
    });
  }

  /**
   * 获取技能关联的聊天服务列表
   * @param skillId - 技能 ID
   */
  async findSkillRelatedSessions(skillId: string): Promise<Array<{
    sessionId: string;
    sessionTitle: string;
    createdAt: Date;
  }>> {
    // 查询使用该技能的用户技能记录
    const userSkills = await this.prisma.userSkill.findMany({
      where: { skillId },
      select: {
        chatId: true,
        createdAt: true,
      },
      distinct: ['chatId'],
    });

    // 获取聊天服务详情
    const chatIds = userSkills.map(us => us.chatId);
    const chatServers = await this.prisma.chatServer.findMany({
      where: {
        id: { in: chatIds },
      },
      select: {
        id: true,
        chatId: true,
        name: true,
      },
    });

    // 合并数据，返回聊天服务信息
    return userSkills.map(us => {
      const chatServer = chatServers.find(cs => cs.id === us.chatId);
      return {
        sessionId: chatServer?.chatId || '',
        sessionTitle: chatServer?.name || '未知聊天服务',
        createdAt: us.createdAt,
      };
    });
  }
}
