import { type Request, type Response } from 'express';
import { TaskRunsRepository } from '../repositories/task-runs.repository.js';
import { DatabaseService } from '../services/database.service.js';
import { TaskRunnerService } from '../services/task-runner.service.js';
import { TasksService } from '../services/tasks.service.js';
import {
  type FindTasksFilters,
  type TaskStatus,
  toTaskRunResponseDto,
} from '../types/task.types.js';

export class TasksController {
  private readonly tasksService: TasksService;
  private readonly taskRunnerService: TaskRunnerService;
  private readonly taskRunsRepository: TaskRunsRepository;

  constructor() {
    const prisma = DatabaseService.getInstance();
    this.tasksService = new TasksService({ prisma });
    this.taskRunnerService = new TaskRunnerService({ prisma });
    this.taskRunsRepository = new TaskRunsRepository(prisma);
  }

  async listTasks(req: Request, res: Response): Promise<void> {
    try {
      const userUuid = this.requireUser(req, res);
      if (!userUuid) return;

      const tasks = await this.tasksService.listTasks(userUuid, this.parseFilters(req));
      res.status(200).json(tasks);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const userUuid = this.requireUser(req, res);
      if (!userUuid) return;

      const task = await this.tasksService.createTask(userUuid, req.body);
      res.status(201).json(task);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getTask(req: Request, res: Response): Promise<void> {
    try {
      const userUuid = this.requireUser(req, res);
      if (!userUuid) return;

      const task = await this.tasksService.getTask(userUuid, this.getParam(req, 'taskUuid'));
      res.status(200).json(task);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const userUuid = this.requireUser(req, res);
      if (!userUuid) return;

      const task = await this.tasksService.updateTask(userUuid, this.getParam(req, 'taskUuid'), req.body);
      res.status(200).json(task);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const userUuid = this.requireUser(req, res);
      if (!userUuid) return;

      await this.tasksService.deleteTask(userUuid, this.getParam(req, 'taskUuid'));
      res.status(204).send();
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async pauseTask(req: Request, res: Response): Promise<void> {
    try {
      const userUuid = this.requireUser(req, res);
      if (!userUuid) return;

      const task = await this.tasksService.pauseTask(userUuid, this.getParam(req, 'taskUuid'));
      res.status(200).json(task);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async resumeTask(req: Request, res: Response): Promise<void> {
    try {
      const userUuid = this.requireUser(req, res);
      if (!userUuid) return;

      const task = await this.tasksService.resumeTask(userUuid, this.getParam(req, 'taskUuid'));
      res.status(200).json(task);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async runTask(req: Request, res: Response): Promise<void> {
    try {
      const userUuid = this.requireUser(req, res);
      if (!userUuid) return;

      const run = await this.taskRunnerService.runSavedTask(
        userUuid,
        this.getParam(req, 'taskUuid'),
        'manual'
      );
      res.status(201).json(run);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async testRun(_req: Request, res: Response): Promise<void> {
    res.status(501).json({
      error: 'Not Implemented',
      message: '测试运行将在未保存任务执行器接入后启用',
    });
  }

  async listRuns(req: Request, res: Response): Promise<void> {
    try {
      const userUuid = this.requireUser(req, res);
      if (!userUuid) return;

      const task = await this.tasksService.requireTaskForUser(userUuid, this.getParam(req, 'taskUuid'));
      const runs = await this.taskRunsRepository.findByTaskId(task.id);
      res.status(200).json(runs.map((run) => toTaskRunResponseDto(run)));
    } catch (error) {
      this.handleError(res, error);
    }
  }

  async getRun(req: Request, res: Response): Promise<void> {
    try {
      const userUuid = this.requireUser(req, res);
      if (!userUuid) return;

      const run = await this.taskRunsRepository.findByRunUuid(this.getParam(req, 'runUuid'));
      if (!run) {
        res.status(404).json({
          error: 'Not Found',
          message: '任务运行记录不存在',
        });
        return;
      }

      if (run.task) {
        await this.tasksService.requireTaskForUser(userUuid, run.task.taskUuid);
      }

      res.status(200).json(toTaskRunResponseDto(run));
    } catch (error) {
      this.handleError(res, error);
    }
  }

  private requireUser(req: Request, res: Response): string | null {
    if (!req.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token is missing or invalid',
      });
      return null;
    }

    return req.userId;
  }

  private getParam(req: Request, name: string): string {
    const value = req.params[name];
    if (typeof value === 'string') {
      return value;
    }

    return Array.isArray(value) ? value[0] : '';
  }

  private parseFilters(req: Request): FindTasksFilters {
    const filters: FindTasksFilters = {};

    if (typeof req.query.search === 'string') {
      filters.search = req.query.search;
    }

    if (typeof req.query.status === 'string' && this.isTaskStatus(req.query.status)) {
      filters.status = req.query.status;
    }

    if (typeof req.query.limit === 'string') {
      const limit = Number(req.query.limit);
      if (Number.isInteger(limit) && limit > 0) {
        filters.limit = limit;
      }
    }

    if (typeof req.query.offset === 'string') {
      const offset = Number(req.query.offset);
      if (Number.isInteger(offset) && offset >= 0) {
        filters.offset = offset;
      }
    }

    return filters;
  }

  private isTaskStatus(value: string): value is TaskStatus {
    return value === 'active' || value === 'paused' || value === 'disabled';
  }

  private handleError(res: Response, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('不存在')) {
      res.status(404).json({
        error: 'Not Found',
        message,
      });
      return;
    }

    if (message.includes('无权')) {
      res.status(403).json({
        error: 'Forbidden',
        message,
      });
      return;
    }

    if (this.isBusinessValidationError(message)) {
      res.status(400).json({
        error: 'Bad Request',
        message,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message,
    });
  }

  private isBusinessValidationError(message: string): boolean {
    return ['请选择', '请填写', '请输入', '尚未装载', '不可用', '已禁用'].some((keyword) =>
      message.includes(keyword)
    );
  }
}
