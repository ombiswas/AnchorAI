import multer from 'multer';
import { ValidationError } from '../utils/errors';

const storage = multer.memoryStorage();

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new ValidationError('Only PDF files (.pdf) are allowed'));
    }
  },
});
