import { type Request, type Response } from 'express';
import { directoriesService } from '../services/directories.service.js';

/**
 * Directories Controller
 * 处理目录管理相关的 HTTP 请求
 */
export class DirectoriesController {
  /**
   * 获取基础目录路径
   * GET /api/directories/base-path
   */
  async getBasePath(_req: Request, res: Response): Promise<void> {
    try {
      const basePath = await directoriesService.getBasePath();
      res.status(200).json({ directory: basePath });
    } catch (error) {
       
      console.error('[DirectoriesController] 获取基础目录失败:', error);
      res.status(503).json({
        error: '无法获取基础目录路径',
        message: error instanceof Error ? error.message : '请检查后端服务是否正常运行',
      });
    }
  }

  /**
   * 创建会话目录
   * POST /api/directories/create
   *
   * Body: { accountNo: string }
   */
  async createSessionDirectory(req: Request, res: Response): Promise<void> {
    try {
      const { accountNo } = req.body;

      if (!accountNo) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'accountNo 字段必填',
        });
        return;
      }

      const result = await directoriesService.prepareSessionDirectory(accountNo);

      res.status(200).json({
        path: result.path,
        name: result.name,
      });
    } catch (error) {
       
      console.error('[DirectoriesController] 创建目录失败:', error);
      res.status(500).json({
        error: '创建目录失败',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  }

  /**
   * 完整流程：获取基础目录并创建用户会话目录
   * POST /api/directories/prepare
   *
   * Body: { accountNo: string }
   */
  async prepareSessionDirectory(req: Request, res: Response): Promise<void> {
    try {
      const { accountNo } = req.body;

      if (!accountNo) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'accountNo 字段必填',
        });
        return;
      }

      const result = await directoriesService.prepareSessionDirectory(accountNo);

      res.status(200).json({
        directory: result.path,
        directoryName: result.name,
      });
    } catch (error) {
       
      console.error('[DirectoriesController] 准备目录失败:', error);
      res.status(503).json({
        error: '准备目录失败',
        message: error instanceof Error ? error.message : '请检查后端服务是否正常运行',
      });
    }
  }
}
