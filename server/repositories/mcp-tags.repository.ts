import { BaseRepository } from './base.repository.js';
import { Prisma } from '@prisma/client';

/**
 * MCP 标签数据访问层
 */
export class McpTagsRepository extends BaseRepository<
  'mcpTag',
  Prisma.McpTagCreateInput,
  Prisma.McpTagUpdateInput,
  Prisma.McpTagWhereInput,
  Prisma.McpTagOrderByWithRelationInput
> {
  protected get modelName(): string {
    return 'mcpTag';
  }

  /**
   * 根据名称查找标签
   */
  async findByName(name: string) {
    return this.prisma.mcpTag.findUnique({
      where: { name },
    });
  }

  /**
   * 获取标签列表（带使用次数统计）
   */
  async findAllWithUsageCount(search?: string) {
    const where: Prisma.McpTagWhereInput = search
      ? { name: { contains: search, mode: 'insensitive' } }
      : {};

    const tags = await this.prisma.mcpTag.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // 获取每个标签的使用次数
    const tagsWithCount = await Promise.all(
      tags.map(async (tag) => {
        const usageCount = await this.prisma.mcpServiceTag.count({
          where: { tagId: tag.id },
        });
        return { ...tag, usageCount };
      })
    );

    return tagsWithCount;
  }

  /**
   * 批量创建或获取标签
   */
  async findOrCreateMany(tagNames: string[]) {
    const tags = await Promise.all(
      tagNames.map(async (name) => {
        let tag = await this.findByName(name);
        if (!tag) {
          tag = await this.create({ name });
        }
        return tag;
      })
    );
    return tags;
  }
}
