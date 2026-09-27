import { Router } from 'express';
import { documentController } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { primerRateLimiter } from '../middleware/rateLimiter.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();

// All document routes require authentication
router.use(authenticate);

router.post('/upload', uploadMiddleware.single('file'), documentController.upload);
router.post('/primer', primerRateLimiter, documentController.createPrimer);
router.post('/:id/append', documentController.appendSection);
router.get('/', documentController.list);
router.get('/:id', documentController.getById);
router.delete('/:id', documentController.delete);

export default router;
