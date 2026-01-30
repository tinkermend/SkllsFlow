import { BaseRepository } from './base.repository.js';
import { Prisma } from '@prisma/client';

/**
 * MCP 分类数据访问层
 */
export class McpCategoriesRepository extends BaseRepository<
  'mcpCategory',
  Prisma.McpCategoryCreateInput,
  Prisma.McpCategoryUpdateInput,
  Prisma.McpCategoryWhereInput,
  Prisma.McpCategoryOrderByWithRelationInput
> {
  protected get modelName(): string {
    return 'mcpCategory';
  }

  /**
   * 获取所有激活的分类（带 MCP 数量统计）
   */
  async findAllActiveWithCount() {
    const categories = await this.prisma.mcpCategory.findMany({
      where: { status: 'active' },
      orderBy: { sortOrder: 'asc' },
    });

    // 获取每个分类的 MCP 数量
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const mcpCount = await this.prisma.mcpService.count({
          where: { categoryId: category.id },
        });
        return { ...category, mcpCount };
      })
    );

    return categoriesWithCount;
  }

  /**
   * 根据 categoryId 查找分类
   */
  async findByCategoryId(categoryId: string) {
    return this.prisma.mcpCategory.findUnique({
      where: { categoryId },
    });
  }
}
