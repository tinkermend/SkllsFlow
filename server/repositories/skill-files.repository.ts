import { PrismaClient, type Prisma, type SkillFile } from '@prisma/client';
import { BaseRepository } from './base.repository.js';

/**
 * SkillFiles Repository
 * 提供技能文件相关的数据库操作
 */
export class SkillFilesRepository extends BaseRepository<
  SkillFile,
  Prisma.SkillFileCreateInput,
  Prisma.SkillFileUpdateInput,
  Prisma.SkillFileWhereInput,
  Prisma.SkillFileOrderByWithRelationInput
> {
  protected get modelName(): string {
    return 'skillFile';
  }

  /**
   * 根据技能 ID 查找文件（查询最新的文件记录）
   */
  async findBySkillId(skillId: bigint): Promise<SkillFile | null> {
    return this.prisma.skillFile.findFirst({
      where: { skillId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 创建技能文件记录
   */
  async createSkillFile(data: {
    skillId: bigint;
    fileData: Buffer;
    fileName: string;
    fileSize: bigint;
    mimeType: string;
  }): Promise<SkillFile> {
    return this.prisma.skillFile.create({
      data,
    });
  }
}
