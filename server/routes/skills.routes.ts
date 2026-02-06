import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { SkillsController } from '../controllers/skills.controller.js';
import { jwtAuthMiddleware } from '../middleware/jwt-auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router: RouterType = Router();

// Middleware to create controller instance per request
router.use((req: Request, res: Response, next: NextFunction) => {
  req.skillsController = new SkillsController();
  next();
});

/**
 * Skills Routes
 */

// POST /api/skills - Create skill with file upload (requires auth)
router.post(
  '/',
  jwtAuthMiddleware,
  upload.single('file'),
  (req: Request, res: Response) => {
    req.skillsController.createSkill(req, res);
  }
);

// GET /api/skills/my-skills - Get current user's skills (requires auth)
router.get('/my-skills', jwtAuthMiddleware, (req: Request, res: Response) => {
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
