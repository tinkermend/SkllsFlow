import {
  Router,
  type NextFunction,
  type Request,
  type Response,
  type Router as RouterType,
} from 'express';
import { TasksController } from '../controllers/tasks.controller.js';
import { jwtAuthMiddleware } from '../middleware/jwt-auth.middleware.js';

const router: RouterType = Router();

router.use(jwtAuthMiddleware);

router.use((req: Request, _res: Response, next: NextFunction) => {
  req.tasksController = new TasksController();
  next();
});

router.get('/', (req: Request, res: Response) => {
  req.tasksController.listTasks(req, res);
});

router.post('/', (req: Request, res: Response) => {
  req.tasksController.createTask(req, res);
});

router.post('/test-run', (req: Request, res: Response) => {
  req.tasksController.testRun(req, res);
});

router.get('/runs/:runUuid', (req: Request, res: Response) => {
  req.tasksController.getRun(req, res);
});

router.get('/:taskUuid', (req: Request, res: Response) => {
  req.tasksController.getTask(req, res);
});

router.patch('/:taskUuid', (req: Request, res: Response) => {
  req.tasksController.updateTask(req, res);
});

router.delete('/:taskUuid', (req: Request, res: Response) => {
  req.tasksController.deleteTask(req, res);
});

router.post('/:taskUuid/run', (req: Request, res: Response) => {
  req.tasksController.runTask(req, res);
});

router.post('/:taskUuid/pause', (req: Request, res: Response) => {
  req.tasksController.pauseTask(req, res);
});

router.post('/:taskUuid/resume', (req: Request, res: Response) => {
  req.tasksController.resumeTask(req, res);
});

router.get('/:taskUuid/runs', (req: Request, res: Response) => {
  req.tasksController.listRuns(req, res);
});

export default router;

declare global {
  namespace Express {
    interface Request {
      tasksController: TasksController;
    }
  }
}
