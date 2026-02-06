import { type Request, type Response } from 'express';
import { SkillsService } from '../services/skills.service.js';

/**
 * Skills Controller
 * 处理技能相关的 HTTP 请求
 */
export class SkillsController {
  private service: SkillsService;

  constructor() {
    this.service = new SkillsService();
  }

  /**
   * 获取所有平台技能
   * GET /api/skills
   */
  async getAllPlatformSkills(req: Request, res: Response): Promise<void> {
    try {
      const skills = await this.service.getAllPlatformSkills();
      res.status(200).json(skills);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * 获取当前用户的技能列表
   * GET /api/skills/my-skills
   */
  async getMySkills(req: Request, res: Response): Promise<void> {
    try {
      const userUuid = req.userId; // 这是 UUID 字符串

      if (!userUuid) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication token is missing or invalid',
        });
        return;
      }

      // 通过 UUID 获取用户技能
      const skills = await this.service.getUserSkillsByUuid(userUuid);
      res.status(200).json(skills);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * 获取技能关联的会话列表
   * GET /api/skills/:skillId/sessions
   */
  async getSkillRelatedSessions(req: Request, res: Response): Promise<void> {
    try {
      const { skillId } = req.params;

      if (!skillId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'skillId is required',
        });
        return;
      }

      const sessions = await this.service.getSkillRelatedSessions(skillId);
      res.status(200).json(sessions);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * 创建技能（包含文件上传）
   * POST /api/skills
   */
  async createSkill(req: Request, res: Response): Promise<void> {
    try {
      // 1. 验证文件是否存在
      if (!req.file) {
        res.status(400).json({
          error: 'Bad Request',
          message: '请上传技能压缩包文件',
        });
        return;
      }

      // 2. 验证必填字段
      const { skillId, name, description, category } = req.body;
      if (!skillId || !name || !description || !category) {
        res.status(400).json({
          error: 'Bad Request',
          message: '缺少必填字段：skillId, name, description, category',
        });
        return;
      }

      // 3. 验证用户认证
      const userUuid = req.userId;
      if (!userUuid) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication token is missing or invalid',
        });
        return;
      }

      // 4. 解析 tags（JSON 字符串转数组）
      let tags: string[] = [];
      if (req.body.tags) {
        try {
          tags = JSON.parse(req.body.tags);
        } catch (e) {
          res.status(400).json({
            error: 'Bad Request',
            message: 'tags 字段格式错误，应为 JSON 数组',
          });
          return;
        }
      }

      // 5. 构建 skillData
      const skillData = {
        skillId,
        name,
        description,
        icon: req.body.icon || null,
        category,
        tags,
        status: (req.body.status || 'active') as 'active' | 'disabled',
        sortOrder: parseInt(req.body.sortOrder || '0', 10),
      };

      // 6. 构建 fileData
      const fileData = {
        fileBuffer: req.file.buffer,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      };

      // 7. 调用 Service 层创建技能
      const skill = await this.service.createSkillWithFile(
        skillData,
        fileData,
        userUuid
      );

      // 8. 返回创建的技能对象
      res.status(201).json(skill);
    } catch (error) {
      // 处理特定错误
      if (error instanceof Error) {
        if (error.message === '技能ID已存在') {
          res.status(409).json({
            error: 'Conflict',
            message: error.message,
          });
          return;
        }
        if (error.message === '用户不存在') {
          res.status(401).json({
            error: 'Unauthorized',
            message: error.message,
          });
          return;
        }
      }
      this.handleError(res, error);
    }
  }

  /**
   * 获取技能文件列表
   * GET /api/skills/:skillId/files
   */
  async getSkillFiles(req: Request, res: Response): Promise<void> {
    try {
      const { skillId } = req.params;

      if (!skillId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'skillId is required',
        });
        return;
      }

      const files = await this.service.getSkillFiles(skillId);
      res.status(200).json(files);
    } catch (error) {
      if (error instanceof Error && error.message === '技能不存在') {
        res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
        return;
      }
      this.handleError(res, error);
    }
  }

  /**
   * 下载技能文件
   * GET /api/skills/:skillId/files/:fileId/download
   */
  async downloadSkillFile(req: Request, res: Response): Promise<void> {
    try {
      const { skillId, fileId } = req.params;

      if (!skillId || !fileId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'skillId and fileId are required',
        });
        return;
      }

      const fileData = await this.service.getSkillFileData(skillId, fileId);

      if (!fileData) {
        res.status(404).json({
          error: 'Not Found',
          message: '文件不存在',
        });
        return;
      }

      // 设置响应头
      res.setHeader('Content-Type', fileData.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileData.fileName)}"`);
      res.setHeader('Content-Length', fileData.fileData.length);

      // 发送文件数据
      res.send(fileData.fileData);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * 装载技能到 ChatServer
   * POST /api/skills/:skillId/load
   */
  async loadSkillToChatServer(req: Request, res: Response): Promise<void> {
    try {
      const { skillId } = req.params;
      const { chatServerId } = req.body;
      const userUuid = req.userId;

      // 验证参数
      if (!skillId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'skillId is required',
        });
        return;
      }

      if (!chatServerId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'chatServerId is required',
        });
        return;
      }

      if (!userUuid) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication token is missing or invalid',
        });
        return;
      }

      // 调用 Service 层装载技能
      await this.service.loadSkillToChatServer(skillId, chatServerId, userUuid);

      res.status(200).json({
        message: '技能装载成功',
      });
    } catch (error) {
      // 处理特定错误
      if (error instanceof Error) {
        if (error.message.includes('不存在')) {
          res.status(404).json({
            error: 'Not Found',
            message: error.message,
          });
          return;
        }
        if (error.message.includes('未激活')) {
          res.status(400).json({
            error: 'Bad Request',
            message: error.message,
          });
          return;
        }
        if (error.message.includes('无权')) {
          res.status(403).json({
            error: 'Forbidden',
            message: error.message,
          });
          return;
        }
        if (error.message.includes('技能装载失败') || error.message.includes('代理服务')) {
          res.status(502).json({
            error: 'Bad Gateway',
            message: error.message,
          });
          return;
        }
      }
      this.handleError(res, error);
    }
  }

  /**
   * 处理错误并返回适当的 HTTP 状态码
   */
  private handleError(res: Response, error: any): void {
    console.error('Skills controller error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
}
