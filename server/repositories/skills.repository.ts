import { PrismaClient, type Prisma, type Skill, type SkillFile } from '@prisma/client';
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
   * 获取所有平台技能（包含创建者信息）
   */
  async findAllPlatformSkillsWithCreator(): Promise<Array<Skill & { creator: { username: string | null } }>> {
    return this.prisma.skill.findMany({
      include: {
        creator: {
          select: { username: true },
        },
      },
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
   * 获取用户的技能列表（通过 UUID，包含创建者信息）
   * @param userUuid - 用户 UUID
   */
  async findUserSkillsByUuidWithCreator(userUuid: string): Promise<Array<Skill & { creator: { username: string | null } }>> {
    const user = await this.prisma.user.findUnique({
      where: { userUUId: userUuid },
      select: { id: true },
    });

    if (!user) {
      return [];
    }

    const userSkills = await this.prisma.userSkill.findMany({
      where: { userId: user.id },
      include: {
        skill: {
          include: {
            creator: {
              select: { username: true },
            },
          },
        },
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

  /**
   * 获取技能文件列表
   * @param skillId - 技能内部 ID (BigInt)
   */
  async findSkillFiles(skillId: bigint): Promise<SkillFile[]> {
    return this.prisma.skillFile.findMany({
      where: { skillId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 获取单个技能文件
   * @param fileId - 文件 ID (BigInt)
   */
  async findSkillFileById(fileId: bigint): Promise<SkillFile | null> {
    return this.prisma.skillFile.findUnique({
      where: { id: fileId },
    });
  }

  /**
   * 获取技能的装载信息（哪些 ChatServer 装载了该技能）
   * @param skillId - 技能 ID（字符串）
   */
  async findSkillLoadedServers(skillId: string): Promise<Array<{
    chatServerId: bigint;
    chatServerName: string;
    chatDir: string;
    proxyHost: string;
    proxyPort: number;
    openCodePort: number;
  }>> {
    const userSkills = await this.prisma.userSkill.findMany({
      where: { skillId },
      include: {
        chatServer: {
          include: {
            proxyHost: true,
          },
        },
      },
      distinct: ['chatId'],
    });

    return userSkills.map(us => ({
      chatServerId: us.chatServer.id,
      chatServerName: us.chatServer.name,
      chatDir: us.chatServer.chatDir,
      proxyHost: us.chatServer.proxyHost.host,
      proxyPort: us.chatServer.proxyHost.port,
      openCodePort: us.chatServer.port,
    }));
  }

  /**
   * 获取指定用户装载该技能的服务列表
   * @param skillId - 技能 ID（字符串）
   * @param userId - 用户 ID（BigInt）
   */
  async findSkillLoadedServersByUser(
    skillId: string,
    userId: bigint
  ): Promise<Array<{
    chatServerId: bigint;
    chatServerName: string;
    chatDir: string;
    proxyHost: string;
    proxyPort: number;
    openCodePort: number;
  }>> {
    const userSkills = await this.prisma.userSkill.findMany({
      where: { skillId, userId },
      include: {
        chatServer: {
          include: {
            proxyHost: true,
          },
        },
      },
      distinct: ['chatId'],
    });

    return userSkills.map(us => ({
      chatServerId: us.chatServer.id,
      chatServerName: us.chatServer.name,
      chatDir: us.chatServer.chatDir,
      proxyHost: us.chatServer.proxyHost.host,
      proxyPort: us.chatServer.proxyHost.port,
      openCodePort: us.chatServer.port,
    }));
  }

  /**
   * 删除指定用户与技能的关联记录
   * @param skillId - 技能 ID（字符串）
   * @param userId - 用户 ID（BigInt）
   * @returns 删除的记录数
   */
  async deleteUserSkillRelations(skillId: string, userId: bigint): Promise<number> {
    const result = await this.prisma.userSkill.deleteMany({
      where: { skillId, userId },
    });

    return result.count;
  }

  /**
   * 统计技能在 user_skills 中的剩余关联数量
   * @param skillId - 技能 ID（字符串）
   */
  async countUserSkillRelations(skillId: string): Promise<number> {
    return this.prisma.userSkill.count({
      where: { skillId },
    });
  }

  /**
   * 删除技能及其关联数据（事务操作）
   * @param skillId - 技能 ID（字符串）
   */
  async deleteSkillWithRelations(skillId: string): Promise<void> {
    const skill = await this.findBySkillId(skillId);
    if (!skill) {
      throw new Error('技能不存在');
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. 删除 user_skills 表中的关联记录（如果有）
      await tx.userSkill.deleteMany({
        where: { skillId },
      });

      // 2. 删除 skill_files 表中的文件记录
      await tx.skillFile.deleteMany({
        where: { skillId: skill.id },
      });

      // 3. 删除 skills 表中的技能记录
      await tx.skill.delete({
        where: { id: skill.id },
      });
    });
  }

  /**
   * 仅删除技能记录（不删除关联数据）
   * @param skillId - 技能 ID（字符串）
   */
  async deleteSkillOnly(skillId: string): Promise<void> {
    const skill = await this.findBySkillId(skillId);
    if (!skill) {
      throw new Error('技能不存在');
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. 删除 skill_files 表中的文件记录
      await tx.skillFile.deleteMany({
        where: { skillId: skill.id },
      });

      // 2. 删除 skills 表中的技能记录
      await tx.skill.delete({
        where: { id: skill.id },
      });
    });
  }
}
