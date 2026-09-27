import rateLimit from 'express-rate-limit';
import { AuthenticatedRequest } from './auth.middleware';

/**
 * Rate limiter middleware for RAG chat endpoints.
 * Limits users to 30 questions per 15-minute window to prevent API credit exhaustion.
 */
export const chatRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each user to 30 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    const authReq = req as AuthenticatedRequest;
    return authReq.userId ? `user_${authReq.userId}` : 'anonymous';
  },
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        message:
          'Rate limit exceeded: You have reached the maximum of 30 questions per 15 minutes.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
    });
  },
});
