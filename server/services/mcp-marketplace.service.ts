import { DatabaseService } from "./database.service.js";
import { McpMarketplaceRepository } from "../repositories/mcp-marketplace.repository.js";
import { McpServicesRepository } from "../repositories/mcp-services.repository.js";
import { NotFoundError } from "../utils/errors.js";
import { serializeBigInt } from "../utils/bigint-serializer.js";

/**
 * MCP 市场业务逻辑层
 */
export class McpMarketplaceService {
  private get prisma() {
    return DatabaseService.getInstance();
  }
  private get marketplaceRepo() {
    return new McpMarketplaceRepository(this.prisma);
  }
  private get servicesRepo() {
    return new McpServicesRepository(this.prisma);
  }

  /**
   * 获取市场列表
   */
  async getMarketplaceList(options: {
    search?: string;
    categoryId?: bigint;
    tags?: string[];
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  }) {
    const result = await this.marketplaceRepo.findMarketplaceItems(options);
    return serializeBigInt(result);
  }

  /**
   * 装载 MCP 到会话
   */
  async loadToSessions(mcpId: string, sessionIds: string[], userId: bigint) {
    const service = await this.servicesRepo.findByMcpId(mcpId);
    if (!service) {
      throw new NotFoundError("MCP 服务不存在");
    }

    let successCount = 0;
    let failedCount = 0;

    // 为每个会话创建关联
    for (const sessionId of sessionIds) {
      try {
        // 检查会话是否存在且属于用户
        const session = await this.prisma.session.findFirst({
          where: {
            sessionId,
            userId,
          },
        });

        if (!session) {
          failedCount++;
          continue;
        }

        // 检查是否已经装载
        const existing = await this.prisma.sessionMcp.findUnique({
          where: {
            sessionId_mcpServiceId: {
              sessionId: session.id,
              mcpServiceId: service.id,
            },
          },
        });

        if (!existing) {
          await this.prisma.sessionMcp.create({
            data: {
              sessionId: session.id,
              mcpServiceId: service.id,
            },
          });
        }

        successCount++;
      } catch (error) {
        failedCount++;
      }
    }

    // 增加安装次数
    if (successCount > 0) {
      await this.marketplaceRepo.incrementInstallationCount(service.id);
    }

    return { successCount, failedCount };
  }

  /**
   * 从会话卸载 MCP
   */
  async unloadFromSessions(
    mcpId: string,
    sessionIds: string[],
    userId: bigint,
  ) {
    const service = await this.servicesRepo.findByMcpId(mcpId);
    if (!service) {
      throw new NotFoundError("MCP 服务不存在");
    }

    // 删除会话关联
    for (const sessionId of sessionIds) {
      const session = await this.prisma.session.findFirst({
        where: {
          sessionId,
          userId,
        },
      });

      if (session) {
        await this.prisma.sessionMcp.deleteMany({
          where: {
            sessionId: session.id,
            mcpServiceId: service.id,
          },
        });
      }
    }

    return { success: true };
  }
}
