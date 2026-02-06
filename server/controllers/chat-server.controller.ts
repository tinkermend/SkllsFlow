import { type Request, type Response } from 'express';
import { env } from '../config/env.js';
import { ChatServerService } from '../services/chat-server.service.js';

/**
 * ChatServer Controller
 * 处理 ChatServer 相关的 HTTP 请求
 */
export class ChatServerController {
  private service: ChatServerService;

  constructor() {
    this.service = new ChatServerService();
  }

  /**
   * 创建新的 ChatServer
   * POST /api/chat-servers
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication token is missing or invalid',
        });
        return;
      }

      const { name } = req.body;

      if (!name) {
        res.status(400).json({
          error: 'Bad Request',
          message: '服务名称不能为空',
        });
        return;
      }

      const chatServer = await this.service.createChatServer(userId, name);

      res.status(201).json(chatServer);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * 获取用户的所有 ChatServer
   * GET /api/chat-servers
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication token is missing or invalid',
        });
        return;
      }

      const chatServers = await this.service.getUserChatServers(userId);
      res.status(200).json(chatServers);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * 获取用户的所有活跃 ChatServer
   * GET /api/chat-servers/active
   */
  async getActive(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication token is missing or invalid',
        });
        return;
      }

      const chatServers = await this.service.getActiveChatServers(userId);
      res.status(200).json(chatServers);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * 删除 ChatServer
   * DELETE /api/chat-servers/:chatId
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication token is missing or invalid',
        });
        return;
      }

      await this.service.deleteChatServer(chatId, userId);
      res.status(204).send();
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * 获取 ChatServer 删除统计信息
   * GET /api/chat-servers/:chatId/delete-stats
   */
  async getDeleteStats(req: Request, res: Response): Promise<void> {
    try {
      const { chatId } = req.params;
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication token is missing or invalid',
        });
        return;
      }

      const stats = await this.service.getDeleteStats(chatId, userId);
      res.json(stats);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * 处理错误并返回适当的 HTTP 状态码
   */
  private handleError(res: Response, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // 参数验证失败
    if (
      errorMessage.includes('不能为空') ||
      errorMessage.includes('最长 16 个字符')
    ) {
      res.status(400).json({
        error: 'Bad Request',
        message: errorMessage,
      });
      return;
    }

    // 无可用代理服务
    if (errorMessage.includes('无可用的代理服务')) {
      res.status(503).json({
        error: 'Service Unavailable',
        message: errorMessage,
      });
      return;
    }

    // 代理服务调用失败
    if (
      errorMessage.includes('代理服务') ||
      errorMessage.includes('启动失败') ||
      errorMessage.includes('删除失败')
    ) {
      res.status(503).json({
        error: 'Service Unavailable',
        message: errorMessage,
      });
      return;
    }

    // 资源不存在
    if (errorMessage.includes('不存在')) {
      res.status(404).json({
        error: 'Not Found',
        message: errorMessage,
      });
      return;
    }

    // 权限不足
    if (errorMessage.includes('无权')) {
      res.status(403).json({
        error: 'Forbidden',
        message: errorMessage,
      });
      return;
    }

    // 通用内部服务器错误
    res.status(500).json({
      error: 'Internal server error',
      message: env.NODE_ENV === 'development' ? errorMessage : undefined,
    });
  }
}
