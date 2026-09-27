import { Types } from 'mongoose';
import { DocumentModel } from '../models/document.model';
import { ITopicResult, QuizAttemptModel } from '../models/quizAttempt.model';
import { ITopicMastery, TopicMasteryModel } from '../models/topicMastery.model';
import { calculateRollingMastery } from '../utils/masteryCalculator';

export interface WeakTopicResponse {
  topicTag: string;
  rollingAccuracy: number;
  totalAttemptsCount: number;
  totalQuestionsSeen: number;
  lastAttemptedAt: Date;
  status: 'critical' | 'moderate' | 'mastered';
}

export interface SubjectSummary {
  subject: string;
  documentCount: number;
  quizCount: number;
}

export interface RecentAttemptSummary {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  subject: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  attemptedAt: Date;
}

export interface DashboardData {
  stats: {
    totalQuizzesTaken: number;
    averageScore: number;
    topicsTrackedCount: number;
    weakTopicsCount: number;
  };
  subjects: SubjectSummary[];
  weakTopics: WeakTopicResponse[];
  recentAttempts: RecentAttemptSummary[];
}

export class AnalyticsService {
  /**
   * Incrementally updates TopicMastery records for each topic in a quiz attempt.
   * Maintains rolling accuracy over the last 5 attempts using the pure calculator.
   */
  public async recordAttemptMastery(userId: string, perTopicResult: ITopicResult[]): Promise<void> {
    if (!perTopicResult || perTopicResult.length === 0) return;

    const userObjectId = new Types.ObjectId(userId);

    for (const topic of perTopicResult) {
      const cleanTag = topic.topicTag.trim();
      if (!cleanTag) continue;

      const existingMastery = await TopicMasteryModel.findOne({
        userId: userObjectId,
        topicTag: cleanTag,
      }).exec();

      const calculation = calculateRollingMastery(existingMastery?.recentAttempts || [], {
        totalQuestions: topic.totalQuestions,
        correctCount: topic.correctCount,
        attemptedAt: new Date(),
      });

      await TopicMasteryModel.findOneAndUpdate(
        { userId: userObjectId, topicTag: cleanTag },
        {
          $set: {
            rollingAccuracy: calculation.rollingAccuracy,
            recentAttempts: calculation.updatedRecentAttempts,
            lastAttemptedAt: new Date(),
          },
          $inc: {
            totalAttemptsCount: 1,
          },
        },
        { upsert: true, new: true }
      ).exec();
    }
  }

  /**
   * Retrieves topics for a user sorted by rolling accuracy ascending (weakest first).
   */
  public async getWeakTopics(userId: string, limit: number = 10): Promise<WeakTopicResponse[]> {
    const userObjectId = new Types.ObjectId(userId);

    const masteries: ITopicMastery[] = await TopicMasteryModel.find({
      userId: userObjectId,
    })
      .sort({ rollingAccuracy: 1, lastAttemptedAt: -1 })
      .limit(limit)
      .exec();

    return masteries.map((m) => {
      const totalQuestionsSeen = m.recentAttempts.reduce((sum, a) => sum + a.totalQuestions, 0);

      let status: 'critical' | 'moderate' | 'mastered' = 'mastered';
      if (m.rollingAccuracy < 60) {
        status = 'critical';
      } else if (m.rollingAccuracy < 75) {
        status = 'moderate';
      }

      return {
        topicTag: m.topicTag,
        rollingAccuracy: m.rollingAccuracy,
        totalAttemptsCount: m.totalAttemptsCount,
        totalQuestionsSeen,
        lastAttemptedAt: m.lastAttemptedAt,
        status,
      };
    });
  }

  /**
   * Aggregates comprehensive dashboard metrics for the student.
   */
  public async getDashboardData(userId: string): Promise<DashboardData> {
    const userObjectId = new Types.ObjectId(userId);

    // 1. Fetch all quiz attempts for aggregated score calculations
    const attempts = await QuizAttemptModel.find({ userId: userObjectId })
      .sort({ attemptedAt: -1 })
      .populate<{ quizId: { _id: Types.ObjectId; title: string; subject: string } }>({
        path: 'quizId',
        select: 'title subject',
      })
      .exec();

    const totalQuizzesTaken = attempts.length;
    const averageScore =
      totalQuizzesTaken > 0
        ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalQuizzesTaken)
        : 0;

    // 2. Fetch weak topics (ascending by accuracy)
    const weakTopics = await this.getWeakTopics(userId, 8);
    const weakTopicsCount = weakTopics.filter((t) => t.rollingAccuracy < 75).length;
    const topicsTrackedCount = await TopicMasteryModel.countDocuments({
      userId: userObjectId,
    }).exec();

    // 3. Recent 5 attempts with quiz metadata
    const recentAttempts: RecentAttemptSummary[] = attempts.slice(0, 5).map((a) => {
      const quizRef = a.quizId as unknown as {
        _id?: Types.ObjectId;
        title?: string;
        subject?: string;
      };
      const correctCount = a.answers.filter((ans) => ans.isCorrect).length;

      return {
        attemptId: a._id.toString(),
        quizId: quizRef?._id ? quizRef._id.toString() : a.quizId.toString(),
        quizTitle: quizRef?.title || 'Knowledge Assessment',
        subject: quizRef?.subject || 'General',
        score: a.score,
        totalQuestions: a.answers.length,
        correctCount,
        attemptedAt: a.attemptedAt,
      };
    });

    // 4. Subject summary across documents and attempts
    const documents = await DocumentModel.find({ userId: userObjectId }).select('subject').exec();
    const subjectMap = new Map<string, { docs: number; quizzes: number }>();

    for (const doc of documents) {
      const sub = doc.subject || 'General';
      const cur = subjectMap.get(sub) || { docs: 0, quizzes: 0 };
      cur.docs += 1;
      subjectMap.set(sub, cur);
    }

    for (const att of attempts) {
      const quizRef = att.quizId as unknown as { subject?: string };
      const sub = quizRef?.subject || 'General';
      const cur = subjectMap.get(sub) || { docs: 0, quizzes: 0 };
      cur.quizzes += 1;
      subjectMap.set(sub, cur);
    }

    const subjects: SubjectSummary[] = Array.from(subjectMap.entries()).map(([sub, counts]) => ({
      subject: sub,
      documentCount: counts.docs,
      quizCount: counts.quizzes,
    }));

    return {
      stats: {
        totalQuizzesTaken,
        averageScore,
        topicsTrackedCount,
        weakTopicsCount,
      },
      subjects,
      weakTopics,
      recentAttempts,
    };
  }
}

export const analyticsService = new AnalyticsService();
