import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { analyticsService } from '../services/analytics.service';

export class AnalyticsController {
  /**
   * GET /api/analytics/weak-topics
   * Returns topic masteries sorted ascending by rolling accuracy (weakest first).
   */
  public async getWeakTopics(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const weakTopics = await analyticsService.getWeakTopics(
        req.userId as string,
        isNaN(limit) ? 10 : limit
      );

      res.status(200).json({ weakTopics });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/dashboard
   * Returns aggregated dashboard metrics, subject breakdown, weak topics, and recent quiz attempts.
   */
  public async getDashboard(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const dashboard = await analyticsService.getDashboardData(req.userId as string);
      res.status(200).json({ dashboard });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
