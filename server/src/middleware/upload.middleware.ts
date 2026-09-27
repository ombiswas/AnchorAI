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
    const isPdf =
      file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    const isImage =
      file.mimetype.startsWith('image/') ||
      /\.(jpe?g|png|webp)$/i.test(file.originalname.toLowerCase());

    if (isPdf || isImage) {
      cb(null, true);
    } else {
      cb(
        new ValidationError(
          'Only PDF files (.pdf) and images (.jpg, .jpeg, .png, .webp) are allowed'
        )
      );
    }
  },
});
