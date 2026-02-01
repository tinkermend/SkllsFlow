import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { DirectoriesController } from '../controllers/directories.controller.js';
import { jwtAuthMiddleware } from '../middleware/jwt-auth.middleware.js';

const router: RouterType = Router();

// Authentication middleware - all routes require auth
router.use(jwtAuthMiddleware);

// Middleware to create controller instance per request
router.use((req: Request, _res: Response, next: NextFunction) => {
  req.directoriesController = new DirectoriesController();
  next();
});

/**
 * Directories Routes
 * All routes require authentication
 */

// GET /api/directories/base-path - 获取基础目录路径
router.get('/base-path', (req: Request, res: Response) => {
  req.directoriesController.getBasePath(req, res);
});

// POST /api/directories/create - 创建会话目录
router.post('/create', (req: Request, res: Response) => {
  req.directoriesController.createSessionDirectory(req, res);
});

// POST /api/directories/prepare - 完整流程：获取基础目录并创建用户会话目录
router.post('/prepare', (req: Request, res: Response) => {
  req.directoriesController.prepareSessionDirectory(req, res);
});

export default router;

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      directoriesController: DirectoriesController;
    }
  }
}
