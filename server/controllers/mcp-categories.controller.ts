import { type Request, type Response } from 'express';
import { env } from '../config/env.js';
import { McpCategoriesService } from '../services/mcp-categories.service.js';
import { BusinessError } from '../utils/errors.js';

const categoriesService = new McpCategoriesService();

/**
 * MCP 分类控制器
 */
export class McpCategoriesController {
  /**
   * 获取分类列表
   */
  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await categoriesService.getAllCategories();
      res.json({ data: categories });
    } catch (error: any) {
      if (error instanceof BusinessError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      res.status(500).json({
        error: '服务器内部错误',
        message: env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}
