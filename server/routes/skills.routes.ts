import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { SkillsController } from '../controllers/skills.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router: RouterType = Router();

// Middleware to create controller instance per request
router.use((req: Request, res: Response, next: NextFunction) => {
  req.skillsController = new SkillsController();
  next();
});

/**
 * Skills Routes
 */

// GET /api/skills/my-skills - Get current user's skills (requires auth)
router.get('/my-skills', authMiddleware, (req: Request, res: Response) => {
  req.skillsController.getMySkills(req, res);
});

// GET /api/skills/:skillId/sessions - Get skill related sessions
router.get('/:skillId/sessions', (req: Request, res: Response) => {
  req.skillsController.getSkillRelatedSessions(req, res);
});

// GET /api/skills - Get all platform skills
router.get('/', (req: Request, res: Response) => {
  req.skillsController.getAllPlatformSkills(req, res);
});

export default router;

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      skillsController: SkillsController;
    }
  }
}
