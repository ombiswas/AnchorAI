import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post('/signup', authRateLimiter, authController.signup);
router.post('/login', authRateLimiter, authController.login);
router.get('/me', authenticate, authController.me);
router.delete('/account', authenticate, authController.deleteAccount);

export default router;

