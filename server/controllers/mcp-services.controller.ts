import { Request, Response } from 'express';
import { McpServicesService } from '../services/mcp-services.service.js';
import { BusinessError } from '../utils/errors.js';

const mcpServicesService = new McpServicesService();

/**
 * MCP 服务控制器
 */
export class McpServicesController {
  /**
   * 获取我的 MCP 列表
   */
  static async getMyServices(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '未授权' });
      }

      const { search, status, language, sortBy, sortOrder, page, pageSize } = req.query;

      const result = await mcpServicesService.getUserServices(BigInt(userId), {
        search: search as string,
        status: status as any,
        language: language as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        page: page ? parseInt(page as string) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error in getMyServices:', {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name,
      });

      if (error instanceof BusinessError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      res.status(500).json({
        error: '服务器内部错误',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * 创建 MCP 服务
   */
  static async createService(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '未授权' });
      }

      const {
        name,
        description,
        icon,
        version,
        language,
        transportType,
        connectionConfig,
        envVars,
        categoryId,
        tags,
      } = req.body;

      const service = await mcpServicesService.createService({
        name,
        description,
        icon,
        version,
        language,
        transportType,
        connectionConfig,
        envVars,
        categoryId: categoryId ? BigInt(categoryId) : undefined,
        tags,
        createdByUserId: BigInt(userId),
      });

      res.status(201).json({
        data: service,
        message: 'MCP 服务创建成功',
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 获取 MCP 服务详情
   */
  static async getServiceDetail(req: Request, res: Response) {
    try {
      const { mcpId } = req.params;
      const detail = await mcpServicesService.getServiceDetail(mcpId);

      if (!detail) {
        return res.status(404).json({ error: 'MCP 服务不存在' });
      }

      res.json({ data: detail });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 更新 MCP 服务
   */
  static async updateService(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '未授权' });
      }

      const { mcpId } = req.params;
      const updateData = req.body;

      if (updateData.categoryId) {
        updateData.categoryId = BigInt(updateData.categoryId);
      }

      const updated = await mcpServicesService.updateService(
        mcpId,
        BigInt(userId),
        updateData
      );

      res.json({
        data: updated,
        message: 'MCP 服务更新成功',
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 删除 MCP 服务
   */
  static async deleteService(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '未授权' });
      }

      const { mcpId } = req.params;
      await mcpServicesService.deleteService(mcpId, BigInt(userId));

      res.json({ message: 'MCP 服务删除成功' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 健康检查
   */
  static async healthCheck(req: Request, res: Response) {
    try {
      const { mcpId } = req.params;
      const result = await mcpServicesService.healthCheck(mcpId);

      res.json({ data: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 重启 MCP 服务
   */
  static async restartService(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '未授权' });
      }

      const { mcpId } = req.params;
      const result = await mcpServicesService.restartService(mcpId, BigInt(userId));

      res.json({
        message: 'MCP 服务重启成功',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 获取 MCP 工具列表
   */
  static async getTools(req: Request, res: Response) {
    try {
      const { mcpId } = req.params;
      const tools = await mcpServicesService.getTools(mcpId);

      res.json({ data: tools });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 获取 MCP 资源列表
   */
  static async getResources(req: Request, res: Response) {
    try {
      const { mcpId } = req.params;
      const resources = await mcpServicesService.getResources(mcpId);

      res.json({ data: resources });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 装载 MCP 到会话
   */
  static async loadToSessions(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '未授权' });
      }

      const { mcpId } = req.params;
      const { sessionIds } = req.body;

      if (!sessionIds || !Array.isArray(sessionIds)) {
        return res.status(400).json({ error: '缺少 sessionIds 参数' });
      }

      const { McpMarketplaceService } = await import('../services/mcp-marketplace.service.js');
      const marketplaceService = new McpMarketplaceService();

      const result = await marketplaceService.loadToSessions(
        mcpId,
        sessionIds,
        BigInt(userId)
      );

      res.json({
        message: 'MCP 装载成功',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 从会话卸载 MCP
   */
  static async unloadFromSessions(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: '未授权' });
      }

      const { mcpId } = req.params;
      const { sessionIds } = req.body;

      if (!sessionIds || !Array.isArray(sessionIds)) {
        return res.status(400).json({ error: '缺少 sessionIds 参数' });
      }

      const { McpMarketplaceService } = await import('../services/mcp-marketplace.service.js');
      const marketplaceService = new McpMarketplaceService();

      await marketplaceService.unloadFromSessions(mcpId, sessionIds, BigInt(userId));

      res.json({ message: 'MCP 卸载成功' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
