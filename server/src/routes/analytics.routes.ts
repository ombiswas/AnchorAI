import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/weak-topics', analyticsController.getWeakTopics);
router.get('/dashboard', analyticsController.getDashboard);

export default router;
