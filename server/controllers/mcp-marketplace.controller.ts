import { Request, Response } from 'express';
import { McpMarketplaceService } from '../services/mcp-marketplace.service.js';
import { BusinessError } from '../utils/errors.js';

const marketplaceService = new McpMarketplaceService();

/**
 * MCP 市场控制器
 */
export class McpMarketplaceController {
  /**
   * 获取市场列表
   */
  static async getMarketplaceList(req: Request, res: Response) {
    try {
      const { search, categoryId, tags, sortBy, sortOrder, page, pageSize } = req.query;

      const result = await marketplaceService.getMarketplaceList({
        search: search as string,
        categoryId: categoryId ? BigInt(categoryId as string) : undefined,
        tags: tags ? (tags as string).split(',') : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        page: page ? parseInt(page as string) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string) : undefined,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error in getMarketplaceList:', {
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
}
