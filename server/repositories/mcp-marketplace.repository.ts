import { BaseRepository } from "./base.repository.js";
import { Prisma } from "@prisma/client";

/**
 * MCP 市场数据访问层
 */
export class McpMarketplaceRepository extends BaseRepository<
  "mcpMarketplaceItem",
  Prisma.McpMarketplaceItemCreateInput,
  Prisma.McpMarketplaceItemUpdateInput,
  Prisma.McpMarketplaceItemWhereInput,
  Prisma.McpMarketplaceItemOrderByWithRelationInput
> {
  protected get modelName(): string {
    return "mcpMarketplaceItem";
  }

  /**
   * 获取市场列表（带分页和筛选）
   */
  async findMarketplaceItems(options: {
    search?: string;
    categoryId?: bigint;
    tags?: string[];
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  }) {
    const {
      search,
      categoryId,
      tags,
      sortBy = "installationCount",
      sortOrder = "desc",
      page = 1,
      pageSize = 20,
    } = options;

    const where: Prisma.McpMarketplaceItemWhereInput = {
      ...(search && {
        mcpService: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        },
      }),
      ...(categoryId && {
        categoryId,
      }),
      ...(tags &&
        tags.length > 0 && {
          mcpService: {
            tags: {
              some: {
                tag: {
                  name: { in: tags },
                },
              },
            },
          },
        }),
    };

    const [data, total] = await Promise.all([
      this.prisma.mcpMarketplaceItem.findMany({
        where,
        include: {
          mcpService: {
            include: {
              category: true,
              creator: {
                select: { username: true },
              },
              tags: {
                include: { tag: true },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.mcpMarketplaceItem.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 增加安装次数
   */
  async incrementInstallationCount(mcpServiceId: bigint) {
    return this.prisma.mcpMarketplaceItem.update({
      where: { mcpServiceId },
      data: {
        installationCount: {
          increment: 1,
        },
      },
    });
  }
}
