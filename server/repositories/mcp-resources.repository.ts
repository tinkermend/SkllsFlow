import { BaseRepository } from './base.repository.js';
import { Prisma } from '@prisma/client';

/**
 * MCP 资源数据访问层
 */
export class McpResourcesRepository extends BaseRepository<
  'mcpResource',
  Prisma.McpResourceCreateInput,
  Prisma.McpResourceUpdateInput,
  Prisma.McpResourceWhereInput,
  Prisma.McpResourceOrderByWithRelationInput
> {
  protected get modelName(): string {
    return 'mcpResource';
  }

  /**
   * 根据服务 ID 获取所有资源
   */
  async findByServiceId(serviceId: bigint) {
    return this.prisma.mcpResource.findMany({
      where: { mcpServiceId: serviceId },
      orderBy: { resourceName: 'asc' },
    });
  }

  /**
   * 批量创建或更新资源
   */
  async upsertMany(serviceId: bigint, resources: Array<{
    resourceName: string;
    resourceType: string;
    resourceDescription?: string;
  }>) {
    return Promise.all(
      resources.map((resource) =>
        this.prisma.mcpResource.upsert({
          where: {
            mcpServiceId_resourceName: {
              mcpServiceId: serviceId,
              resourceName: resource.resourceName,
            },
          },
          create: {
            mcpServiceId: serviceId,
            ...resource,
          },
          update: resource,
        })
      )
    );
  }
}
