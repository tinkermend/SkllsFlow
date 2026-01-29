import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { SessionsController } from '../controllers/sessions.controller.js';
import { jwtAuthMiddleware } from '../middleware/jwt-auth.middleware.js';

const router: RouterType = Router();

// Authentication middleware - all routes require auth
router.use(jwtAuthMiddleware);

// Middleware to create controller instance per request
router.use((req: Request, res: Response, next: NextFunction) => {
  req.controller = new SessionsController();
  next();
});

/**
 * Sessions Routes
 * All routes require authentication
 */

// GET /api/sessions - Get all sessions for the user
router.get('/', (req: Request, res: Response) => {
  req.controller.getAll(req, res);
});

// POST /api/sessions - Create a new session
router.post('/', (req: Request, res: Response) => {
  req.controller.create(req, res);
});

// GET /api/sessions/:sessionId - Get session by ID
router.get('/:sessionId', (req: Request, res: Response) => {
  req.controller.getById(req, res);
});

export default router;

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      controller: SessionsController;
    }
  }
}
