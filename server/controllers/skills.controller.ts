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
