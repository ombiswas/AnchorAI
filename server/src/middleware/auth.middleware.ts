import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError } from '../utils/errors';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

interface JwtPayload {
  userId: string;
  email: string;
}

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication token is required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('Authentication token has expired'));
    }
    return next(new UnauthorizedError('Invalid authentication token'));
  }
};
