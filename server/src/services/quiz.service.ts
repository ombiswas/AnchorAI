import { Types } from 'mongoose';
import { z } from 'zod';
import { ChunkModel } from '../models/chunk.model';
import { DocumentModel } from '../models/document.model';
import { IQuiz, QuizModel } from '../models/quiz.model';
import { IQuizAttempt, QuizAttemptModel } from '../models/quizAttempt.model';
import { NotFoundError, ValidationError } from '../utils/errors';
import { analyticsService } from './analytics.service';
import { llmService } from './llm.service';

export const quizQuestionZodSchema = z.object({
  questionText: z.string().min(5, 'Question text must be at least 5 characters'),
  options: z.array(z.string().min(1)).length(4, 'Question must provide exactly 4 options'),
  correctOptionIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(5, 'Explanation must be at least 5 characters'),
  topicTag: z.string().min(2).max(50),
});

export const quizGenerationZodSchema = z.object({
  title: z.string().optional(),
  questions: z.array(quizQuestionZodSchema).min(1, 'Quiz must include at least one question'),
});

export type QuizGeneratedData = z.infer<typeof quizGenerationZodSchema>;

export interface SubmitAnswerDto {
  questionIndex: number;
  selectedOptionIndex: number;
}

export class QuizService {
  /**
   * Generates a multi-question quiz sampled evenly across selected documents.
   * Enforces strict Zod schema validation with automatic single retry on malformed JSON.
   */
  public async generateQuiz(
    userId: string,
    documentIds: string[],
    questionCount = 5,
    focusTopics?: string[]
  ): Promise<IQuiz> {
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      throw new ValidationError('At least one document ID must be provided to generate a quiz');
    }

    const validCount = Math.min(Math.max(questionCount, 1), 15);
    const objectIds = documentIds.map((id) => new Types.ObjectId(id));

    // 1. Verify user ownership of all requested documents
    const documents = await DocumentModel.find({
      _id: { $in: objectIds },
      userId: new Types.ObjectId(userId),
      status: 'ready',
    }).exec();

    if (documents.length === 0) {
      throw new NotFoundError(
        'None of the selected documents were found in ready state for this account'
      );
    }

    const docTitles = documents.map((d) => d.title).join(', ');
    const primarySubject = documents[0]?.subject || 'General';

    // 2. Retrieve and sample chunks evenly across all selected documents
    const allChunks = await ChunkModel.find({
      documentId: { $in: objectIds },
      userId: new Types.ObjectId(userId),
    })
      .sort({ documentId: 1, 'metadata.chunkIndex': 1 })
      .select('text metadata documentId')
      .exec();

    if (allChunks.length === 0) {
      throw new ValidationError(
        'Selected documents have no extracted vector chunks. Please ensure ingestion completed.'
      );
    }

    // Evenly sample up to 14 chunks across the material
    const targetSampleSize = Math.min(allChunks.length, Math.max(validCount * 2, 8));
    const sampledChunks: typeof allChunks = [];
    const step = allChunks.length / targetSampleSize;

    for (let i = 0; i < targetSampleSize; i++) {
      const idx = Math.min(Math.floor(i * step), allChunks.length - 1);
      sampledChunks.push(allChunks[idx]);
    }

    console.log(
      `[quiz] Sampled ${sampledChunks.length} chunks evenly from ${allChunks.length} total chunks for doc(s): ${docTitles}`
    );

    // 3. Assemble prompt context
    const contextText = sampledChunks
      .map(
        (chunk, idx) =>
          `[Excerpt #${idx + 1} | Page ${chunk.metadata?.page || 'N/A'}]\n${chunk.text}`
      )
      .join('\n\n---\n\n');

    const focusInstruction =
      focusTopics && focusTopics.length > 0
        ? `\n7. WEAK TOPIC REMEDIATION: The student is specifically struggling with these concepts: [${focusTopics.join(
            ', '
          )}]. You MUST weight questions heavily toward these concepts and test deep comprehension of these specific topics.`
        : '';

    const systemPrompt = `You are an expert university professor creating a rigorous diagnostic quiz for students.
Your task is to generate exactly ${validCount} multiple-choice questions grounded STRICTLY in the provided study excerpts.

Rules:
1. Every question must test a real concept, formula, mechanism, or definition directly stated in the excerpts.
2. Provide exactly 4 plausible options for each question (indices 0, 1, 2, 3).
3. Specify the exact zero-based integer index of the single correct option ('correctOptionIndex': 0, 1, 2, or 3).
4. Provide a clear, educational explanation explaining WHY the correct option is right and referencing the excerpt notes.
5. Group questions under clean, consistent topic tags (e.g., 'Core Concepts', 'Architectures', 'Formulas'). Pick 2 to 4 distinct topic tags overall. Do not invent random tags.${focusInstruction}
6. You MUST return ONLY a valid, parseable JSON object matching this exact JSON schema:
{
  "title": "${documents[0]?.title || 'Study'} Diagnostic Quiz",
  "questions": [
    {
      "questionText": "Question description?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOptionIndex": 0,
      "explanation": "Clear explanation referencing the notes.",
      "topicTag": "Topic Name"
    }
  ]
}
Do not include any conversational filler, markdown commentary, or text outside the JSON object.`;

    const userPrompt = `Generate a ${validCount}-question quiz from these course excerpts:\n\n${contextText}`;

    // 4. Request completion and validate with Zod (with single retry on format failure)
    let generatedData = await this.requestAndParseQuiz(systemPrompt, userPrompt);

    if (!generatedData) {
      console.warn(
        '[quiz] First attempt returned invalid JSON. Retrying once with strict schema enforcement...'
      );
      const retrySystemPrompt = `${systemPrompt}\n\nCRITICAL WARNING: Your previous output failed JSON validation. Ensure all questions have exactly 4 strings in options and correctOptionIndex is an integer between 0 and 3. Return RAW JSON ONLY.`;
      generatedData = await this.requestAndParseQuiz(retrySystemPrompt, userPrompt);
    }

    if (!generatedData || generatedData.questions.length === 0) {
      throw new ValidationError(
        'Failed to generate a valid structured quiz from your notes. Please try again with clearer excerpts.'
      );
    }

    // 5. Store Quiz in Database
    const quizTitle =
      generatedData.title?.trim() ||
      `${documents[0]?.title || 'Study Material'} Quiz (${validCount} Questions)`;

    const quiz = await QuizModel.create({
      userId: new Types.ObjectId(userId),
      title: quizTitle,
      subject: primarySubject,
      sourceDocumentIds: objectIds,
      questions: generatedData.questions.slice(0, validCount),
      createdAt: new Date(),
    });

    console.log(
      `[quiz] Successfully created Quiz ${quiz._id} with ${quiz.questions.length} questions`
    );
    return quiz;
  }

  /**
   * Helper that calls the LLM, strips markdown, and runs Zod schema validation.
   */
  private async requestAndParseQuiz(
    systemPrompt: string,
    userPrompt: string
  ): Promise<QuizGeneratedData | null> {
    try {
      const rawOutput = await llmService.generateCompletion({
        systemPrompt,
        userPrompt,
        temperature: 0.2,
      });

      // Handle local dev mock response
      if (rawOutput.startsWith('[Dev Mode Response]')) {
        return this.generateMockQuiz();
      }

      // Extract JSON substring from markdown backticks or braces
      const cleanedJson = this.extractJsonString(rawOutput);
      const parsed = JSON.parse(cleanedJson);

      const validation = quizGenerationZodSchema.safeParse(parsed);
      if (validation.success) {
        return validation.data;
      }

      console.warn('[quiz] Zod validation failed:', validation.error.format());
      return null;
    } catch (err) {
      console.warn('[quiz] JSON parse failed on LLM output:', (err as Error).message);
      return null;
    }
  }

  /**
   * Strips markdown fences, quotes, and whitespace to extract clean JSON object.
   */
  private extractJsonString(raw: string): string {
    const trimmed = raw.trim();
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch && fenceMatch[1]) {
      return fenceMatch[1].trim();
    }

    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return trimmed.substring(firstBrace, lastBrace + 1);
    }

    return trimmed;
  }

  /**
   * Generates a deterministic mock quiz for offline development testing.
   */
  private generateMockQuiz(): QuizGeneratedData {
    return {
      title: 'Practice Diagnostic Quiz (Dev Mode)',
      questions: [
        {
          questionText: 'What is the primary role of an index in a database management system?',
          options: [
            'To accelerate query lookup times by organizing search pointers',
            'To encrypt sensitive user passwords before disk storage',
            'To compress PDF documents into smaller binary chunks',
            'To manage HTTP routing headers in web servers',
          ],
          correctOptionIndex: 0,
          explanation:
            'Database indexes maintain ordered data structures (such as B-trees) allowing fast binary search lookups without scanning all rows.',
          topicTag: 'Database Indexing',
        },
        {
          questionText: 'Why is cosine similarity commonly used to compare vector embeddings?',
          options: [
            'It calculates Euclidean distance between coordinates regardless of magnitude',
            'It evaluates the cosine of the angle between vectors, measuring orientation rather than length',
            'It converts vectors into character strings for regex matching',
            'It computes the SHA-256 hash of high-dimensional vectors',
          ],
          correctOptionIndex: 1,
          explanation:
            'Cosine similarity measures the orientation of two semantic vectors in multidimensional space, making it invariant to vector scale.',
          topicTag: 'Vector Search',
        },
        {
          questionText:
            'Which strategy guarantees idempotent document chunking in an ingestion pipeline?',
          options: [
            'Inserting new chunks without checking for existing records',
            'Deleting existing chunks associated with the documentId before saving updated chunks',
            'Increasing the server rate limit per authenticated user',
            'Storing raw PDFs in browser memory cookies',
          ],
          correctOptionIndex: 1,
          explanation:
            'Removing previous chunk records prior to storing new vectors ensures re-processing the same document never creates duplicate vectors.',
          topicTag: 'Ingestion Architecture',
        },
      ],
    };
  }

  /**
   * Evaluates user-submitted answers entirely server-side.
   * Never trusts client-computed scores or correctness assertions.
   */
  public async submitQuiz(
    userId: string,
    quizId: string,
    userAnswers: SubmitAnswerDto[]
  ): Promise<{ attempt: IQuizAttempt; quiz: IQuiz }> {
    if (!Types.ObjectId.isValid(quizId)) {
      throw new ValidationError('Invalid quiz ID format');
    }

    const quiz = await QuizModel.findOne({
      _id: new Types.ObjectId(quizId),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (!quiz) {
      throw new NotFoundError('Quiz not found or access denied');
    }

    const totalQuestions = quiz.questions.length;
    if (totalQuestions === 0) {
      throw new ValidationError('Quiz contains no questions to evaluate');
    }

    // Build answer map: questionIndex -> selectedOptionIndex
    const answerMap = new Map<number, number>();
    for (const ans of userAnswers || []) {
      answerMap.set(ans.questionIndex, ans.selectedOptionIndex);
    }

    // Evaluate each question against stored ground truth
    let correctCount = 0;
    const evaluatedAnswers = quiz.questions.map((q, idx) => {
      const selected = answerMap.has(idx) ? (answerMap.get(idx) as number) : -1;
      const isCorrect = selected === q.correctOptionIndex;
      if (isCorrect) correctCount++;

      return {
        questionIndex: idx,
        selectedOptionIndex: selected,
        isCorrect,
      };
    });

    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

    // Compute granular per-topic breakdown
    const topicStats = new Map<string, { total: number; correct: number }>();
    quiz.questions.forEach((q, idx) => {
      const topic = q.topicTag || 'General';
      const stats = topicStats.get(topic) || { total: 0, correct: 0 };
      stats.total += 1;
      if (evaluatedAnswers[idx]?.isCorrect) {
        stats.correct += 1;
      }
      topicStats.set(topic, stats);
    });

    const perTopicResult = Array.from(topicStats.entries()).map(([topicTag, stats]) => ({
      topicTag,
      totalQuestions: stats.total,
      correctCount: stats.correct,
      masteryPercentage: Math.round((stats.correct / stats.total) * 100),
    }));

    // Record QuizAttempt
    const attempt = await QuizAttemptModel.create({
      quizId: quiz._id,
      userId: new Types.ObjectId(userId),
      answers: evaluatedAnswers,
      score: scorePercentage,
      perTopicResult,
      attemptedAt: new Date(),
    });

    // Incrementally update user's TopicMastery rolling aggregate
    try {
      await analyticsService.recordAttemptMastery(userId, perTopicResult);
    } catch (analyticsErr) {
      console.error('[quiz] Failed to update TopicMastery aggregate:', analyticsErr);
    }

    console.log(
      `[quiz] Evaluated Quiz ${quizId} for user ${userId}: Score ${scorePercentage}% (${correctCount}/${totalQuestions})`
    );

    return { attempt, quiz };
  }

  /**
   * Generates a focused quiz weighted specifically toward the student's weakest topics.
   * If target topics or document IDs are omitted, automatically fetches the user's weakest topics
   * and ready documents.
   */
  public async generateFocusedQuiz(
    userId: string,
    documentIds?: string[],
    questionCount = 5,
    requestedFocusTopics?: string[]
  ): Promise<IQuiz> {
    let targetDocIds = documentIds;

    // Default to ready documents if none supplied
    if (!targetDocIds || targetDocIds.length === 0) {
      const readyDocs = await DocumentModel.find({
        userId: new Types.ObjectId(userId),
        status: 'ready',
      })
        .select('_id')
        .limit(6)
        .exec();

      if (readyDocs.length === 0) {
        throw new ValidationError('No ready documents found to generate a focused quiz.');
      }

      targetDocIds = readyDocs.map((d) => d._id.toString());
    }

    // Determine target topics: user requested or automatically derived weak topics (<75% mastery)
    let focusTopics = requestedFocusTopics?.filter((t) => t.trim().length > 0) || [];
    if (focusTopics.length === 0) {
      const weakTopics = await analyticsService.getWeakTopics(userId, 4);
      focusTopics = weakTopics.map((wt) => wt.topicTag);
    }

    return this.generateQuiz(userId, targetDocIds, questionCount, focusTopics);
  }

  /**
   * Retrieves a quiz for active taking, masking correctOptionIndex and explanation
   * so students cannot cheat via browser devtools inspection.
   */
  public async getQuizForTaking(
    userId: string,
    quizId: string
  ): Promise<{
    _id: string;
    title: string;
    subject: string;
    sourceDocumentIds: Types.ObjectId[];
    questions: Array<{
      questionText: string;
      options: string[];
      topicTag: string;
    }>;
  }> {
    if (!Types.ObjectId.isValid(quizId)) {
      throw new ValidationError('Invalid quiz ID format');
    }

    const quiz = await QuizModel.findOne({
      _id: new Types.ObjectId(quizId),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (!quiz) {
      throw new NotFoundError('Quiz not found or access denied');
    }

    return {
      _id: quiz._id.toString(),
      title: quiz.title,
      subject: quiz.subject,
      sourceDocumentIds: quiz.sourceDocumentIds,
      questions: quiz.questions.map((q) => ({
        questionText: q.questionText,
        options: q.options,
        topicTag: q.topicTag,
      })),
    };
  }

  /**
   * Retrieves all quiz attempts for the authenticated user.
   */
  public async getUserQuizAttempts(userId: string): Promise<IQuizAttempt[]> {
    return QuizAttemptModel.find({ userId: new Types.ObjectId(userId) })
      .sort({ attemptedAt: -1 })
      .exec();
  }

  /**
   * Retrieves all quizzes generated by the authenticated user.
   */
  public async getUserQuizzes(userId: string): Promise<IQuiz[]> {
    return QuizModel.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }
}

export const quizService = new QuizService();
