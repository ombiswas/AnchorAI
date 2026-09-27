import mongoose from 'mongoose';
import { connectDB } from '../src/config/db';
import { DocumentModel } from '../src/models/document.model';
import { QuizModel } from '../src/models/quiz.model';
import { QuizAttemptModel } from '../src/models/quizAttempt.model';
import { recalculateTopicMastery } from '../src/services/analytics.service';

/**
 * One-off maintenance script to clean up orphaned Quiz and QuizAttempt records
 * resulting from documents deleted prior to cascading quiz deletion.
 *
 * Execution flow:
 * 1. Connects to MongoDB database.
 * 2. Identifies all Quiz records whose sourceDocumentIds point to non-existent Documents.
 * 3. Finds all QuizAttempts associated with those orphaned quizzes.
 * 4. Collects the set of affected topic tags and user IDs.
 * 5. Deletes the orphaned QuizAttempt and Quiz documents.
 * 6. Invokes recalculateTopicMastery for each affected user and topic tag to re-derive
 *    accurate rolling metrics from surviving attempts (or prune topic if 0 remain).
 * 7. Outputs a detailed, non-silent execution report.
 */
async function runCleanup() {
  console.log('===============================================================');
  console.log('[cleanup] Starting Orphaned Quiz & Attempt Data Maintenance');
  console.log('===============================================================');

  try {
    await connectDB();

    // 1. Fetch all existing Document IDs in memory for fast O(1) set lookup
    const existingDocs = await DocumentModel.find().select('_id title').exec();
    const existingDocIds = new Set(existingDocs.map((d) => d._id.toString()));
    console.log(`[cleanup] Cataloged ${existingDocIds.size} existing active documents in database.`);

    // 2. Scan all quizzes to find any referencing missing source documents
    const allQuizzes = await QuizModel.find().exec();
    const orphanedQuizzes = allQuizzes.filter((quiz) => {
      if (!quiz.sourceDocumentIds || quiz.sourceDocumentIds.length === 0) {
        return true;
      }
      return quiz.sourceDocumentIds.some((docId) => !existingDocIds.has(docId.toString()));
    });

    if (orphanedQuizzes.length === 0) {
      console.log('[cleanup] Clean state: No orphaned Quiz documents found. Database is consistent.');
      await mongoose.disconnect();
      console.log('[cleanup] Disconnected from MongoDB. Exiting cleanly.');
      process.exit(0);
    }

    console.log(`[cleanup] Found ${orphanedQuizzes.length} orphaned Quiz document(s):`);
    for (const q of orphanedQuizzes) {
      console.log(`  - Quiz ID: ${q._id} | Title: "${q.title}" | Subject: "${q.subject}"`);
    }

    const orphanedQuizIds = orphanedQuizzes.map((q) => q._id);

    // 3. Find all QuizAttempt records for these orphaned quizzes
    const orphanedAttempts = await QuizAttemptModel.find({
      quizId: { $in: orphanedQuizIds },
    }).exec();

    console.log(
      `[cleanup] Found ${orphanedAttempts.length} associated QuizAttempt record(s) to be removed.`
    );

    // 4. Collect affected users and topic tags BEFORE deletion
    // Map: userId (string) -> Set<topicTag (string)>
    const userTopicMap = new Map<string, Set<string>>();

    const recordUserTopic = (userId: string, tag: string) => {
      const clean = tag.trim();
      if (!clean) return;
      if (!userTopicMap.has(userId)) {
        userTopicMap.set(userId, new Set());
      }
      userTopicMap.get(userId)!.add(clean);
    };

    for (const quiz of orphanedQuizzes) {
      const uid = quiz.userId.toString();
      for (const question of quiz.questions) {
        if (question.topicTag) {
          recordUserTopic(uid, question.topicTag);
        }
      }
    }

    for (const attempt of orphanedAttempts) {
      const uid = attempt.userId.toString();
      for (const topicResult of attempt.perTopicResult) {
        if (topicResult.topicTag) {
          recordUserTopic(uid, topicResult.topicTag);
        }
      }
    }

    // 5. Delete orphaned QuizAttempts
    const attemptDeleteResult = await QuizAttemptModel.deleteMany({
      quizId: { $in: orphanedQuizIds },
    });
    console.log(
      `[cleanup] Deleted ${attemptDeleteResult.deletedCount} orphaned QuizAttempt record(s).`
    );

    // 6. Delete orphaned Quizzes
    const quizDeleteResult = await QuizModel.deleteMany({
      _id: { $in: orphanedQuizIds },
    });
    console.log(`[cleanup] Deleted ${quizDeleteResult.deletedCount} orphaned Quiz record(s).`);

    // 7. Recalculate Topic Mastery for every affected user and topic tag
    console.log('\n[cleanup] Recalculating Topic Mastery from remaining source-of-truth attempts...');
    let recalculatedCount = 0;
    let prunedCount = 0;

    for (const [userId, topics] of userTopicMap.entries()) {
      console.log(`  User: ${userId} (${topics.size} topic(s) to check)`);
      for (const topicTag of topics) {
        const result = await recalculateTopicMastery(userId, topicTag);
        if (result) {
          console.log(
            `    - "${topicTag}": Recalculated -> Rolling Accuracy: ${result.rollingAccuracy}% over ${result.totalAttemptsCount} surviving attempt(s)`
          );
          recalculatedCount++;
        } else {
          console.log(
            `    - "${topicTag}": Pruned -> 0 surviving attempts remaining. Topic removed from TopicMastery.`
          );
          prunedCount++;
        }
      }
    }

    // 8. Log Execution Summary
    console.log('\n===============================================================');
    console.log('[cleanup] Cleanup Operation Completed Successfully');
    console.log('===============================================================');
    console.log(`  - Orphaned Quizzes Deleted:    ${quizDeleteResult.deletedCount}`);
    console.log(`  - Orphaned Attempts Deleted:   ${attemptDeleteResult.deletedCount}`);
    console.log(`  - Users Processed:             ${userTopicMap.size}`);
    console.log(`  - Topic Masteries Recomputed:  ${recalculatedCount}`);
    console.log(`  - Topic Masteries Pruned (0):  ${prunedCount}`);
    console.log('===============================================================\n');

    await mongoose.disconnect();
    console.log('[cleanup] Disconnected from MongoDB. Exiting cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('[cleanup] FATAL: Cleanup script encountered an error:', error);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore secondary disconnect error
    }
    process.exit(1);
  }
}

// Execute the cleanup
void runCleanup();
