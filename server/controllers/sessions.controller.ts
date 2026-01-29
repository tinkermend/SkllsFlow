import { type Request, type Response } from 'express';
import { SessionsService } from '../services/sessions.service.js';

/**
 * Sessions Controller
 * Handles HTTP requests for session management
 */
export class SessionsController {
  private service: SessionsService;

  constructor() {
    this.service = new SessionsService();
  }

  /**
   * Create a new session
   * POST /api/sessions
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

      const body = req.body || {};
      const session = await this.service.createSession(userId, body);

      res.status(201).json(session);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Get all sessions for the authenticated user
   * GET /api/sessions
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

      const sessions = await this.service.getUserSessions(userId);
      res.status(200).json(sessions);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Get session by ID
   * GET /api/sessions/:sessionId
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication token is missing or invalid',
        });
        return;
      }

      const session = await this.service.getSessionById(sessionId as string, userId);

      if (!session) {
        res.status(404).json({
          error: 'Session not found',
        });
        return;
      }

      res.status(200).json(session);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  /**
   * Handle errors and return appropriate HTTP status codes
   */
  private handleError(res: Response, error: any): void {
    console.error('Session controller error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error.constructor.name,
    });

    // Duplicate session_id (unique constraint violation)
    if (error.message?.includes('already exists')) {
      res.status(409).json({
        error: 'Unique constraint violation',
        details: error.message,
      });
      return;
    }

    // Access denied
    if (error.message?.includes('Access denied')) {
      res.status(403).json({
        error: 'Access denied',
        details: error.message,
      });
      return;
    }

    // OpenCode API failure
    if (error.message?.includes('OpenCode')) {
      res.status(503).json({
        error: 'Service Unavailable',
        message: error.message,
      });
      return;
    }

    // Generic internal server error
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
