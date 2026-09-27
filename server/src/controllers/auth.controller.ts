import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { authService } from '../services/auth.service';

export class AuthController {
  /**
   * POST /api/auth/signup
   */
  public async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.signup(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   */
  public async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getProfile(req.userId as string);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/auth/account
   */
  public async deleteAccount(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await authService.deleteAccount(req.userId as string);
      res.status(200).json({
        message: 'User account and all associated study materials deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
