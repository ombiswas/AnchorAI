import mongoose, { Types } from 'mongoose';
import { connectDB } from '../src/config/db';
import { ChunkModel } from '../src/models/chunk.model';
import { DocumentModel } from '../src/models/document.model';
import { QuizModel } from '../src/models/quiz.model';
import { QuizAttemptModel } from '../src/models/quizAttempt.model';
import { TopicMasteryModel } from '../src/models/topicMastery.model';
import { recalculateTopicMastery } from '../src/services/analytics.service';
import { documentService } from '../src/services/document.service';

/**
 * Automated Verification Script for Cascade Deletion and Topic Mastery Recalculation
 *
 * Scenarios Tested:
 * 1. Shared Topic Tag:
 *    - Document A and Document B both have quizzes and attempts tagged with "Database Indexing".
 *    - Before deletion: Combined rolling accuracy is derived from attempts across both documents.
 *    - After cascading deletion of Document A: Attempts from Quiz A are deleted.
 *    - Mastery for "Database Indexing" is re-derived exclusively from Document B's remaining attempts.
 * 2. Exclusive Topic Tag:
 *    - Document A has an exclusive topic tag "B-Tree Internals" (not present in Document B).
 *    - After cascading deletion of Document A: 0 surviving attempts remain.
 *    - Mastery for "B-Tree Internals" must be completely pruned from TopicMasteryModel (no ghost record / 0%).
 */
async function runTest() {
  console.log('======================================================================');
  console.log('[test] Cascade Deletion & Topic Mastery Recalculation Verification');
  console.log('======================================================================');

  await connectDB();

  const testUserId = new Types.ObjectId().toString();
  const sharedTag = 'Database Indexing';
  const exclusiveTag = 'B-Tree Internals';

  let testPassed = true;
  const assert = (condition: boolean, description: string) => {
    if (condition) {
      console.log(`  [PASS] ${description}`);
    } else {
      console.error(`  [FAIL] ${description}`);
      testPassed = false;
    }
  };

  try {
    // -------------------------------------------------------------------------
    // Step 1: Create Test Documents A and B
    // -------------------------------------------------------------------------
    console.log('\n[1/5] Setting up test documents...');
    const docA = await DocumentModel.create({
      userId: new Types.ObjectId(testUserId),
      title: 'Doc A: Advanced Indexing & Storage',
      subject: 'Computer Science',
      fileType: 'primer',
      fileUrl: 'internal://primer',
      status: 'ready',
      chunkCount: 2,
    });

    const docB = await DocumentModel.create({
      userId: new Types.ObjectId(testUserId),
      title: 'Doc B: Query Optimization & Engines',
      subject: 'Computer Science',
      fileType: 'primer',
      fileUrl: 'internal://primer',
      status: 'ready',
      chunkCount: 2,
    });

    // Create dummy chunks
    await ChunkModel.insertMany([
      {
        documentId: docA._id,
        userId: new Types.ObjectId(testUserId),
        text: 'Sample chunk for Doc A',
        embedding: [0.1, 0.2, 0.3],
        metadata: { chunkIndex: 0, tokenCount: 10 },
      },
      {
        documentId: docB._id,
        userId: new Types.ObjectId(testUserId),
        text: 'Sample chunk for Doc B',
        embedding: [0.4, 0.5, 0.6],
        metadata: { chunkIndex: 0, tokenCount: 10 },
      },
    ]);

    // -------------------------------------------------------------------------
    // Step 2: Create Quizzes referencing Document A and Document B
    // -------------------------------------------------------------------------
    console.log('[2/5] Creating Quizzes with shared and exclusive topic tags...');
    // Quiz A has questions with sharedTag and exclusiveTag
    const quizA = await QuizModel.create({
      userId: new Types.ObjectId(testUserId),
      title: 'Quiz A: Indexing Deep Dive',
      subject: 'Computer Science',
      sourceDocumentIds: [docA._id],
      questions: [
        {
          questionText: 'What is a B-Tree clustered index?',
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          correctOptionIndex: 0,
          explanation: 'B-Trees store indexed rows in leaf nodes.',
          topicTag: sharedTag,
        },
        {
          questionText: 'What is a B-Tree internal page split?',
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          correctOptionIndex: 1,
          explanation: 'Page splits occur on overflow.',
          topicTag: exclusiveTag,
        },
      ],
    });

    // Quiz B has questions with sharedTag only
    const quizB = await QuizModel.create({
      userId: new Types.ObjectId(testUserId),
      title: 'Quiz B: Query Planning & Indexes',
      subject: 'Computer Science',
      sourceDocumentIds: [docB._id],
      questions: [
        {
          questionText: 'When does a query planner use index scan?',
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          correctOptionIndex: 2,
          explanation: 'Index scan is selected based on selectivity.',
          topicTag: sharedTag,
        },
      ],
    });

    // -------------------------------------------------------------------------
    // Step 3: Create QuizAttempt records
    // -------------------------------------------------------------------------
    console.log('[3/5] Creating QuizAttempt records across both documents...');
    // Attempt A1 (on Quiz A):
    // - sharedTag: 2 questions, 2 correct (100%)
    // - exclusiveTag: 2 questions, 1 correct (50%)
    await QuizAttemptModel.create({
      quizId: quizA._id,
      userId: new Types.ObjectId(testUserId),
      answers: [],
      score: 75,
      perTopicResult: [
        { topicTag: sharedTag, totalQuestions: 2, correctCount: 2, masteryPercentage: 100 },
        { topicTag: exclusiveTag, totalQuestions: 2, correctCount: 1, masteryPercentage: 50 },
      ],
      attemptedAt: new Date(Date.now() - 30000),
    });

    // Attempt A2 (on Quiz A):
    // - sharedTag: 2 questions, 0 correct (0%)
    // - exclusiveTag: 2 questions, 2 correct (100%)
    await QuizAttemptModel.create({
      quizId: quizA._id,
      userId: new Types.ObjectId(testUserId),
      answers: [],
      score: 50,
      perTopicResult: [
        { topicTag: sharedTag, totalQuestions: 2, correctCount: 0, masteryPercentage: 0 },
        { topicTag: exclusiveTag, totalQuestions: 2, correctCount: 2, masteryPercentage: 100 },
      ],
      attemptedAt: new Date(Date.now() - 20000),
    });

    // Attempt B1 (on Quiz B):
    // - sharedTag: 5 questions, 4 correct (80%)
    await QuizAttemptModel.create({
      quizId: quizB._id,
      userId: new Types.ObjectId(testUserId),
      answers: [],
      score: 80,
      perTopicResult: [
        { topicTag: sharedTag, totalQuestions: 5, correctCount: 4, masteryPercentage: 80 },
      ],
      attemptedAt: new Date(Date.now() - 10000),
    });

    // Calculate baseline topic masteries before deletion
    const initialSharedMastery = await recalculateTopicMastery(testUserId, sharedTag);
    const initialExclusiveMastery = await recalculateTopicMastery(testUserId, exclusiveTag);

    // Initial Math:
    // sharedTag:
    //   Total questions = 2 + 2 + 5 = 9
    //   Total correct   = 2 + 0 + 4 = 6
    //   Accuracy        = round((6 / 9) * 100) = 67%
    // exclusiveTag:
    //   Total questions = 2 + 2 = 4
    //   Total correct   = 1 + 2 = 3
    //   Accuracy        = round((3 / 4) * 100) = 75%
    console.log('\n--- Initial Baseline State Before Deletion ---');
    console.log(`  "${sharedTag}": ${initialSharedMastery?.rollingAccuracy}% (expected 67%)`);
    console.log(`  "${exclusiveTag}": ${initialExclusiveMastery?.rollingAccuracy}% (expected 75%)`);

    assert(initialSharedMastery?.rollingAccuracy === 67, 'Initial shared mastery is 67% (6/9 correct)');
    assert(initialExclusiveMastery?.rollingAccuracy === 75, 'Initial exclusive mastery is 75% (3/4 correct)');

    // -------------------------------------------------------------------------
    // Step 4: Perform Cascade Deletion of Document A (preserveHistory: false)
    // -------------------------------------------------------------------------
    console.log('\n[4/5] Executing deleteDocument for Doc A with cascade (preserveHistory: false)...');
    const deleteResult = await documentService.deleteDocument(testUserId, docA._id.toString(), false);

    console.log(`  Cascade deletion summary: ${deleteResult.message}`);
    assert(deleteResult.preservedHistory === false, 'Result indicates preservedHistory: false');
    assert(deleteResult.deletedQuizzesCount === 1, 'Reported 1 quiz deleted (Quiz A)');
    assert(deleteResult.deletedAttemptsCount === 2, 'Reported 2 attempts deleted (Attempts A1 & A2)');

    // -------------------------------------------------------------------------
    // Step 5: Verify Post-Deletion Database State
    // -------------------------------------------------------------------------
    console.log('\n[5/5] Asserting database integrity & post-cascade mastery scores...');

    // 1. Doc A is gone, Doc B remains
    const checkDocA = await DocumentModel.findById(docA._id);
    const checkDocB = await DocumentModel.findById(docB._id);
    assert(checkDocA === null, 'Document A was deleted');
    assert(checkDocB !== null, 'Document B is preserved');

    // 2. Quiz A is gone, Quiz B remains
    const checkQuizA = await QuizModel.findById(quizA._id);
    const checkQuizB = await QuizModel.findById(quizB._id);
    assert(checkQuizA === null, 'Quiz A was deleted');
    assert(checkQuizB !== null, 'Quiz B is preserved');

    // 3. Attempts for Quiz A are gone, Attempt for Quiz B remains
    const survivingAttempts = await QuizAttemptModel.find({ userId: new Types.ObjectId(testUserId) });
    assert(survivingAttempts.length === 1, `Surviving attempts count is 1 (found: ${survivingAttempts.length})`);
    assert(
      survivingAttempts[0]?.quizId.toString() === quizB._id.toString(),
      'The only surviving attempt belongs to Quiz B'
    );

    // 4. Assert Shared Topic Mastery:
    // Should be recalculated ONLY from surviving Attempt B1:
    // Questions = 5, Correct = 4 -> Accuracy = round((4 / 5) * 100) = 80%!
    const postDeleteSharedMastery = await TopicMasteryModel.findOne({
      userId: new Types.ObjectId(testUserId),
      topicTag: sharedTag,
    });

    assert(postDeleteSharedMastery !== null, `"${sharedTag}" TopicMastery record still exists`);
    assert(
      postDeleteSharedMastery?.rollingAccuracy === 80,
      `"${sharedTag}" rolling accuracy was recalculated to exactly 80% (surviving 4/5) - not stale (67%) and not zeroed out`
    );
    assert(
      postDeleteSharedMastery?.totalAttemptsCount === 1,
      `"${sharedTag}" totalAttemptsCount updated to 1`
    );

    // 5. Assert Exclusive Topic Mastery:
    // Had attempts only from Doc A. Since Doc A and its quizzes/attempts were deleted,
    // 0 attempts remain -> MUST BE PRUNED from TopicMasteryModel entirely!
    const postDeleteExclusiveMastery = await TopicMasteryModel.findOne({
      userId: new Types.ObjectId(testUserId),
      topicTag: exclusiveTag,
    });

    assert(
      postDeleteExclusiveMastery === null,
      `"${exclusiveTag}" was completely pruned from TopicMasteryModel (no ghost entry, no 0% lingering)`
    );

    console.log('\n======================================================================');
    if (testPassed) {
      console.log('[SUCCESS] All cascade recalculation assertions passed with 100% precision.');
    } else {
      console.error('[FAILURE] One or more assertions failed.');
    }
    console.log('======================================================================');
  } finally {
    // Clean up test data
    console.log('\n[cleanup] Cleaning up test records from database...');
    await DocumentModel.deleteMany({ userId: new Types.ObjectId(testUserId) });
    await ChunkModel.deleteMany({ text: /Sample chunk for Doc/ });
    await QuizModel.deleteMany({ userId: new Types.ObjectId(testUserId) });
    await QuizAttemptModel.deleteMany({ userId: new Types.ObjectId(testUserId) });
    await TopicMasteryModel.deleteMany({ userId: new Types.ObjectId(testUserId) });
    await mongoose.disconnect();
    console.log('[cleanup] Disconnected from MongoDB. Complete.');
  }
}

runTest().catch((err) => {
  console.error('Unexpected test error:', err);
  process.exit(1);
});
