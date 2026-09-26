import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';
import { chatRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// Require authentication and rate limiting for chat
router.use(authenticate);
router.post('/:documentId', chatRateLimiter, chatController.askQuestion);

export default router;
