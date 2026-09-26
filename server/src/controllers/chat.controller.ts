import { NextFunction, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ragService } from '../services/rag.service';

const chatQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, { message: 'Question cannot be empty' })
    .max(1000, { message: 'Question is too long (maximum 1000 characters)' }),
});

export class ChatController {
  /**
   * POST /api/chat/:documentId
   */
  public async askQuestion(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parseResult = chatQuestionSchema.safeParse(req.body);
      if (!parseResult.success) {
        const issue = parseResult.error.issues[0];
        res.status(400).json({
          error: {
            message: issue ? issue.message : 'Invalid question payload',
            code: 'VALIDATION_ERROR',
          },
        });
        return;
      }

      const { question } = parseResult.data;
      const documentId = req.params.documentId as string;

      const result = await ragService.askQuestion(req.userId as string, documentId, question);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
