import { DatabaseService } from "./database.service.js";
import { McpServicesRepository } from "../repositories/mcp-services.repository.js";
import { McpToolsRepository } from "../repositories/mcp-tools.repository.js";
import { McpResourcesRepository } from "../repositories/mcp-resources.repository.js";
import { McpTagsRepository } from "../repositories/mcp-tags.repository.js";
import { McpServiceTagsRepository } from "../repositories/mcp-service-tags.repository.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import { serializeBigInt } from "../utils/bigint-serializer.js";
import type {
  McpServiceQueryOptions,
  HealthCheckResult,
} from "../types/mcp.types.js";

/**
 * MCP 服务业务逻辑层
 */
export class McpServicesService {
  private get prisma() {
    return DatabaseService.getInstance();
  }
  private get servicesRepo() {
    return new McpServicesRepository(this.prisma);
  }
  private get toolsRepo() {
    return new McpToolsRepository(this.prisma);
  }
  private get resourcesRepo() {
    return new McpResourcesRepository(this.prisma);
  }
  private get tagsRepo() {
    return new McpTagsRepository(this.prisma);
  }
  private get serviceTagsRepo() {
    return new McpServiceTagsRepository(this.prisma);
  }

  private async syncMarketplaceItem(params: {
    mcpServiceId: bigint;
    creatorUserId?: bigint | null;
    categoryId?: bigint | null;
    createOnly?: boolean;
  }) {
    const { mcpServiceId, creatorUserId, categoryId, createOnly = false } = params;

    const payload = {
      mcpId: mcpServiceId,
      creatorUserId: creatorUserId ?? null,
      categoryId: categoryId ?? null,
    };

    if (createOnly) {
      return this.prisma.mcpMarketplaceItem.create({
        data: payload,
      });
    }

    return this.prisma.mcpMarketplaceItem.upsert({
      where: { mcpId: mcpServiceId },
      create: payload,
      update: {
        categoryId: categoryId ?? null,
      },
    });
  }

  /**
   * 获取用户的 MCP 服务列表
   */
  async getUserServices(userId: bigint, options: McpServiceQueryOptions) {
    const result = await this.servicesRepo.findUserServices(userId, options);

    // 转换标签数据：从关系对象数组转换为标签名数组
    const transformedData = result.data.map((service: any) => ({
      ...service,
      categoryName: service.category?.name,
      createdByUser: service.creator,
      tags: service.tags?.map((t: any) => t.tag.name) || [],
    }));

    return serializeBigInt({
      ...result,
      data: transformedData,
    });
  }

  /**
   * 创建 MCP 服务
   */
  async createService(data: {
    name: string;
    description?: string;
    icon?: string;
    version?: string;
    language?: string;
    transportType: "stdio" | "sse" | "websocket";
    connectionConfig: any;
    envVars?: any;
    categoryId?: bigint;
    tags?: string[];
    createdByUserId: bigint;
  }) {
    const { tags, ...serviceData } = data;

    // 生成唯一的 mcpId
    const mcpId = `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 创建服务
    const service = await this.servicesRepo.create({
      mcpId,
      ...serviceData,
      status: "inactive",
    });

    // 处理标签
    if (tags && tags.length > 0) {
      const tagRecords = await this.tagsRepo.findOrCreateMany(tags);
      const tagAssociations = tagRecords.map((tag) => ({
        mcpServiceId: service.id,
        tagId: tag.id,
      }));
      await this.serviceTagsRepo.createMany(tagAssociations);
    }

    await this.syncMarketplaceItem({
      mcpServiceId: service.id,
      creatorUserId: service.createdByUserId,
      categoryId: service.categoryId,
      createOnly: true,
    });

    return serializeBigInt(service);
  }

  /**
   * 获取 MCP 服务详情
   */
  async getServiceDetail(mcpId: string) {
    const service = await this.servicesRepo.findByMcpId(mcpId);
    if (!service) {
      throw new NotFoundError("MCP 服务不存在");
    }

    const detail = await this.servicesRepo.findDetailById(service.id);
    return serializeBigInt(detail);
  }

  /**
   * 更新 MCP 服务
   */
  async updateService(
    mcpId: string,
    userId: bigint,
    data: {
      name?: string;
      description?: string;
      icon?: string;
      version?: string;
      language?: string;
      connectionConfig?: any;
      envVars?: any;
      categoryId?: bigint;
      tags?: string[];
    },
  ) {
    const service = await this.servicesRepo.findByMcpId(mcpId);
    if (!service) {
      throw new NotFoundError("MCP 服务不存在");
    }

    // 权限检查
    if (service.createdByUserId !== userId) {
      throw new ForbiddenError("无权限修改此 MCP 服务");
    }

    const { tags, ...updateData } = data;

    // 更新服务
    const updated = await this.servicesRepo.update(service.id, updateData);

    // 更新标签
    if (tags) {
      // 删除旧标签关联
      await this.serviceTagsRepo.deleteByServiceId(service.id);

      // 创建新标签关联
      if (tags.length > 0) {
        const tagRecords = await this.tagsRepo.findOrCreateMany(tags);
        const tagAssociations = tagRecords.map((tag) => ({
          mcpServiceId: service.id,
          tagId: tag.id,
        }));
        await this.serviceTagsRepo.createMany(tagAssociations);
      }
    }

    await this.syncMarketplaceItem({
      mcpServiceId: service.id,
      creatorUserId: service.createdByUserId,
      categoryId: updated.categoryId ?? service.categoryId ?? null,
    });

    return updated;
  }

  /**
   * 删除 MCP 服务
   */
  async deleteService(mcpId: string, userId: bigint) {
    const service = await this.servicesRepo.findByMcpId(mcpId);
    if (!service) {
      throw new NotFoundError("MCP 服务不存在");
    }

    // 权限检查
    if (service.createdByUserId !== userId) {
      throw new ForbiddenError("无权限删除此 MCP 服务");
    }

    // 删除关联数据
    await this.prisma.$transaction(async (tx) => {
      // 删除标签关联
      await tx.mcpServiceTag.deleteMany({
        where: { mcpServiceId: service.id },
      });

      // 删除工具
      await tx.mcpTool.deleteMany({
        where: { mcpServiceId: service.id },
      });

      // 删除资源
      await tx.mcpResource.deleteMany({
        where: { mcpServiceId: service.id },
      });

      // 删除会话关联
      await tx.sessionMcp.deleteMany({
        where: { mcpServiceId: service.id },
      });

      // 删除市场项
      await tx.mcpMarketplaceItem.deleteMany({
        where: { mcpServiceId: service.id },
      });

      // 删除服务
      await tx.mcpService.delete({
        where: { id: service.id },
      });
    });

    return { success: true };
  }

  /**
   * 健康检查
   */
  async healthCheck(mcpId: string): Promise<HealthCheckResult> {
    const service = await this.servicesRepo.findByMcpId(mcpId);
    if (!service) {
      throw new Error("MCP 服务不存在");
    }

    // TODO: 实现真实的健康检查逻辑
    // 这里暂时返回模拟数据
    const result: HealthCheckResult = {
      status: "healthy",
      latency: Math.floor(Math.random() * 200) + 50,
      message: "服务运行正常",
      checkedAt: new Date(),
    };

    // 更新健康检查结果
    await this.servicesRepo.update(service.id, {
      lastHealthCheckAt: new Date(),
      healthCheckResult: result as any,
      status: result.status === "healthy" ? "active" : "error",
    });

    return result;
  }

  /**
   * 重启 MCP 服务
   */
  async restartService(mcpId: string, userId: bigint) {
    const service = await this.servicesRepo.findByMcpId(mcpId);
    if (!service) {
      throw new Error("MCP 服务不存在");
    }

    // 权限检查
    if (service.createdByUserId !== userId) {
      throw new Error("无权限重启此 MCP 服务");
    }

    // TODO: 实现真实的重启逻辑
    // 这里暂时只更新状态
    await this.servicesRepo.update(service.id, {
      status: "active",
    });

    return { success: true, status: "active" };
  }

  /**
   * 获取 MCP 工具列表
   */
  async getTools(mcpId: string) {
    const service = await this.servicesRepo.findByMcpId(mcpId);
    if (!service) {
      throw new Error("MCP 服务不存在");
    }

    const tools = await this.toolsRepo.findByServiceId(service.id);
    return serializeBigInt(tools);
  }

  /**
   * 获取 MCP 资源列表
   */
  async getResources(mcpId: string) {
    const service = await this.servicesRepo.findByMcpId(mcpId);
    if (!service) {
      throw new Error("MCP 服务不存在");
    }

    const resources = await this.resourcesRepo.findByServiceId(service.id);
    return serializeBigInt(resources);
  }
}
