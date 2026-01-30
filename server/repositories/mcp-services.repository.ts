import { BaseRepository } from "./base.repository.js";
import { Prisma } from "@prisma/client";
import type { McpServiceQueryOptions } from "../types/mcp.types.js";

/**
 * MCP 服务数据访问层
 */
export class McpServicesRepository extends BaseRepository<
  "mcpService",
  Prisma.McpServiceCreateInput,
  Prisma.McpServiceUpdateInput,
  Prisma.McpServiceWhereInput,
  Prisma.McpServiceOrderByWithRelationInput
> {
  protected get modelName(): string {
    return "mcpService";
  }

  /**
   * 根据 mcpId 查找服务
   */
  async findByMcpId(mcpId: string) {
    return this.prisma.mcpService.findUnique({
      where: { mcpId },
    });
  }

  /**
   * 获取用户的 MCP 服务列表（带分页和筛选）
   */
  async findUserServices(userId: bigint, options: McpServiceQueryOptions) {
    const {
      search,
      status,
      language,
      categoryId,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      pageSize = 20,
    } = options;

    const where: Prisma.McpServiceWhereInput = {
      createdByUserId: userId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(status && { status }),
      ...(language && { language }),
      ...(categoryId && { categoryId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.mcpService.findMany({
        where,
        include: {
          category: true,
          creator: {
            select: { id: true, username: true, avatar: true },
          },
          tags: {
            include: { tag: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.mcpService.count({ where }),
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
   * 获取 MCP 服务详情（包含工具、资源、关联会话）
   */
  async findDetailById(id: bigint) {
    return this.prisma.mcpService.findUnique({
      where: { id },
      include: {
        category: true,
        creator: {
          select: { id: true, username: true, avatar: true },
        },
        tags: {
          include: { tag: true },
        },
        tools: true,
        resources: true,
        sessionMcps: {
          include: {
            session: {
              select: {
                id: true,
                sessionId: true,
                title: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });
  }
}
