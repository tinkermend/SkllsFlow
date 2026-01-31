import { type Request, type Response } from 'express';
import { McpTagsService } from '../services/mcp-tags.service.js';
import { BusinessError } from '../utils/errors.js';

const tagsService = new McpTagsService();

/**
 * MCP 标签控制器
 */
export class McpTagsController {
  /**
   * 获取标签列表
   */
  static async getTags(req: Request, res: Response) {
    try {
      const { search } = req.query;
      const tags = await tagsService.getTags(search as string);
      res.json({ data: tags });
    } catch (error: any) {
      if (error instanceof BusinessError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      res.status(500).json({ error: '服务器内部错误' });
    }
  }

  /**
   * 创建标签
   */
  static async createTag(req: Request, res: Response) {
    try {
      const { name, color } = req.body;

      if (!name) {
        return res.status(400).json({ error: '标签名称不能为空' });
      }

      const tag = await tagsService.createTag({ name, color });
      res.status(201).json({
        data: tag,
        message: '标签创建成功',
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
