import { Router } from 'express';
import { quizController } from '../controllers/quiz.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All quiz endpoints require an active authenticated user
router.use(authenticate);

router.post('/generate', quizController.generate);
router.get('/', quizController.list);
router.get('/:id', quizController.getForTaking);
router.post('/:id/submit', quizController.submit);

export default router;
