import { Types } from 'mongoose';
import { DocumentModel } from '../models/document.model';
import { ITopicResult, QuizAttemptModel } from '../models/quizAttempt.model';
import { ITopicMastery, TopicMasteryModel } from '../models/topicMastery.model';
import { AttemptRecord, DEFAULT_ROLLING_WINDOW } from '../utils/masteryCalculator';

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
   * Re-derives rolling accuracy for a given topic ENTIRELY from all existing QuizAttempts
   * in the database for that user/topicTag.
   *
   * Architectural Decisions Explained:
   * 1. Single Source of Truth: Recomputes mastery from scratch based on actual historical
   *    QuizAttempt records rather than incremental mutations. This prevents state drift,
   *    makes testing deterministic, and handles retrospective quiz/document deletions cleanly.
   * 2. Pure Derivation with Windowing: Collects all attempts containing this topic tag in
   *    chronological order, selects the latest window (last 5 attempts), and calculates
   *    the exact rolling accuracy percentage: Math.round((totalCorrect / totalQuestionsSeen) * 100).
   * 3. Cascade Pruning: If zero attempts exist for this topic (e.g. after orphaned quiz deletion),
   *    any existing TopicMastery record is pruned from the database so ghost topics do not linger.
   * 4. Single Mutation Point: This is the ONLY place where TopicMastery records are written.
   *
   * @param userId - The user ID owning the topic mastery
   * @param topicTag - The conceptual topic tag to re-evaluate
   * @returns Updated ITopicMastery document, or null if pruned/no attempts found
   */
  public async recalculateTopicMastery(
    userId: string,
    topicTag: string
  ): Promise<ITopicMastery | null> {
    const cleanTag = topicTag.trim();
    if (!cleanTag) return null;

    const userObjectId = new Types.ObjectId(userId);

    // 1. Fetch all quiz attempts containing this topic tag for this user in chronological order
    const attempts = await QuizAttemptModel.find({
      userId: userObjectId,
      'perTopicResult.topicTag': cleanTag,
    })
      .sort({ attemptedAt: 1 })
      .select('perTopicResult attemptedAt')
      .exec();

    // 2. Extract chronological attempt records specifically for this topic
    const topicAttempts: AttemptRecord[] = [];
    for (const att of attempts) {
      const topicResult = att.perTopicResult.find(
        (t) => t.topicTag.trim().toLowerCase() === cleanTag.toLowerCase()
      );
      if (topicResult && topicResult.totalQuestions > 0) {
        topicAttempts.push({
          totalQuestions: topicResult.totalQuestions,
          correctCount: Math.min(topicResult.correctCount, topicResult.totalQuestions),
          attemptedAt: att.attemptedAt,
        });
      }
    }

    // 3. If no attempts exist, remove any orphaned TopicMastery record so it won't display in analytics
    if (topicAttempts.length === 0) {
      await TopicMasteryModel.deleteOne({
        userId: userObjectId,
        topicTag: cleanTag,
      }).exec();
      return null;
    }

    // 4. Derive rolling window (last DEFAULT_ROLLING_WINDOW attempts, default 5)
    const windowSize = DEFAULT_ROLLING_WINDOW;
    const recentAttempts =
      topicAttempts.length > windowSize
        ? topicAttempts.slice(topicAttempts.length - windowSize)
        : topicAttempts;

    const totalQuestionsSeen = recentAttempts.reduce((sum, a) => sum + a.totalQuestions, 0);
    const totalCorrect = recentAttempts.reduce((sum, a) => sum + a.correctCount, 0);
    const rollingAccuracy =
      totalQuestionsSeen > 0 ? Math.round((totalCorrect / totalQuestionsSeen) * 100) : 0;
    const lastAttemptedAt = topicAttempts[topicAttempts.length - 1].attemptedAt;

    // 5. Persist the recomputed mastery record atomically
    const updatedMastery = await TopicMasteryModel.findOneAndUpdate(
      { userId: userObjectId, topicTag: cleanTag },
      {
        $set: {
          rollingAccuracy,
          recentAttempts,
          totalAttemptsCount: topicAttempts.length,
          lastAttemptedAt,
        },
      },
      { upsert: true, returnDocument: 'after' }
    ).exec();

    return updatedMastery;
  }

  /**
   * Updates TopicMastery records for each topic in a quiz attempt by delegating to recalculateTopicMastery.
   */
  public async recordAttemptMastery(userId: string, perTopicResult: ITopicResult[]): Promise<void> {
    if (!perTopicResult || perTopicResult.length === 0) return;

    for (const topic of perTopicResult) {
      if (topic.topicTag) {
        await this.recalculateTopicMastery(userId, topic.topicTag);
      }
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

export const recalculateTopicMastery = (
  userId: string,
  topicTag: string
) => analyticsService.recalculateTopicMastery(userId, topicTag);
