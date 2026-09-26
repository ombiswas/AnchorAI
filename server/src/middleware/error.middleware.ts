import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const primaryIssue = err.issues[0];
    res.status(400).json({
      error: {
        message: primaryIssue ? primaryIssue.message : 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: err.flatten(),
      },
    });
    return;
  }

  // Handle Mongoose duplicate key error (code 11000)
  if ((err as { code?: number }).code === 11000) {
    res.status(409).json({
      error: {
        message: 'An account with this email already exists',
        code: 'CONFLICT',
      },
    });
    return;
  }

  console.error('[Unhandled Error]', err);

  // Fallback for internal server errors
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
};
