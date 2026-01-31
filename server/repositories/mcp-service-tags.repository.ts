import { BaseRepository } from './base.repository.js';
import { type Prisma } from '@prisma/client';

/**
 * MCP 服务标签关联数据访问层
 */
export class McpServiceTagsRepository extends BaseRepository<
  'mcpServiceTag',
  Prisma.McpServiceTagCreateInput,
  Prisma.McpServiceTagUpdateInput,
  Prisma.McpServiceTagWhereInput,
  Prisma.McpServiceTagOrderByWithRelationInput
> {
  protected get modelName(): string {
    return 'mcpServiceTag';
  }

  /**
   * 批量创建服务标签关联
   */
  async createMany(data: Array<{ mcpServiceId: bigint; tagId: bigint }>) {
    return this.prisma.mcpServiceTag.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * 删除服务的所有标签关联
   */
  async deleteByServiceId(mcpServiceId: bigint) {
    return this.prisma.mcpServiceTag.deleteMany({
      where: { mcpServiceId },
    });
  }

  /**
   * 获取服务的所有标签
   */
  async findByServiceId(mcpServiceId: bigint) {
    return this.prisma.mcpServiceTag.findMany({
      where: { mcpServiceId },
      include: { tag: true },
    });
  }
}
