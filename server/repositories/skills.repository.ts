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
   * 获取技能关联的会话列表
   * @param skillId - 技能 ID
   */
  async findSkillRelatedSessions(skillId: string): Promise<Array<{
    sessionId: string;
    sessionTitle: string;
    createdAt: Date;
  }>> {
    const sessionSkills = await this.prisma.sessionSkill.findMany({
      where: { skillId },
      select: {
        sessionId: true,
        createdAt: true,
      },
    });

    // 获取会话详情
    const sessionIds = sessionSkills.map(ss => ss.sessionId);
    const sessions = await this.prisma.session.findMany({
      where: {
        sessionId: { in: sessionIds },
      },
      select: {
        sessionId: true,
        title: true,
      },
    });

    // 合并数据
    return sessionSkills.map(ss => {
      const session = sessions.find(s => s.sessionId === ss.sessionId);
      return {
        sessionId: ss.sessionId,
        sessionTitle: session?.title || '未知会话',
        createdAt: ss.createdAt,
      };
    });
  }
}
