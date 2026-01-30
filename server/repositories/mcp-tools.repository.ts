import { BaseRepository } from './base.repository.js';
import { Prisma } from '@prisma/client';

/**
 * MCP 工具数据访问层
 */
export class McpToolsRepository extends BaseRepository<
  'mcpTool',
  Prisma.McpToolCreateInput,
  Prisma.McpToolUpdateInput,
  Prisma.McpToolWhereInput,
  Prisma.McpToolOrderByWithRelationInput
> {
  protected get modelName(): string {
    return 'mcpTool';
  }

  /**
   * 根据服务 ID 获取所有工具
   */
  async findByServiceId(serviceId: bigint) {
    return this.prisma.mcpTool.findMany({
      where: { mcpServiceId: serviceId },
      orderBy: { toolName: 'asc' },
    });
  }

  /**
   * 批量创建或更新工具
   */
  async upsertMany(serviceId: bigint, tools: Array<{
    toolName: string;
    toolDescription?: string;
    toolSchema: any;
  }>) {
    return Promise.all(
      tools.map((tool) =>
        this.prisma.mcpTool.upsert({
          where: {
            mcpServiceId_toolName: {
              mcpServiceId: serviceId,
              toolName: tool.toolName,
            },
          },
          create: {
            mcpServiceId: serviceId,
            ...tool,
          },
          update: tool,
        })
      )
    );
  }
}
