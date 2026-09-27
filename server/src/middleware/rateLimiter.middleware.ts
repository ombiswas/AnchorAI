import rateLimit from 'express-rate-limit';
import { AuthenticatedRequest } from './auth.middleware';

/**
 * Rate limiter for unauthenticated auth endpoints (POST /signup, POST /login).
 * Limits each IP address to 10 requests per 15-minute window to prevent
 * brute-force password attacks and signup flooding. Keyed by IP because no
 * JWT exists yet at this point in the request lifecycle.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? 'unknown',
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        message:
          'Too many attempts from this IP. Please wait 15 minutes before trying again.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
    });
  },
});

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

/**
 * Rate limiter middleware for Primer generation endpoints.
 * Limits users to 15 primer generations per 15-minute window to prevent LLM credit burn.
 */
export const primerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    const authReq = req as AuthenticatedRequest;
    return authReq.userId ? `primer_user_${authReq.userId}` : 'anonymous';
  },
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        message:
          'Rate limit exceeded: You have reached the maximum of 15 study primers per 15 minutes.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
    });
  },
});
