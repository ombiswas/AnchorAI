import OpenAI from 'openai';

export interface BatchEmbeddingResult {
  embeddings: number[][];
  totalTokens: number;
}

export class EmbeddingService {
  private openai: OpenAI | null = null;
  private readonly model = 'text-embedding-3-small';
  private readonly dimensions = 1536;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ apiKey });
    } else {
      console.warn(
        '[embeddings] OPENAI_API_KEY is not configured. Falling back to deterministic local mock vectors for development.'
      );
    }
  }

  /**
   * Generates embeddings with retry and exponential backoff.
   */
  private async createEmbeddingWithRetry(
    texts: string[],
    maxRetries = 3,
    initialDelayMs = 1000
  ): Promise<{ embeddings: number[][]; totalTokens: number }> {
    if (!this.openai) {
      // Deterministic pseudo-embedding generator for local testing without API key
      const mockEmbeddings = texts.map((text) => this.generateMockEmbedding(text));
      const estimatedTokens = texts.reduce((acc, t) => acc + Math.ceil(t.length / 4), 0);
      return {
        embeddings: mockEmbeddings,
        totalTokens: estimatedTokens,
      };
    }

    let delay = initialDelayMs;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.openai.embeddings.create({
          model: this.model,
          input: texts,
          encoding_format: 'float',
        });

        const embeddings = response.data.map((item) => item.embedding);
        const totalTokens = response.usage?.total_tokens || 0;

        return { embeddings, totalTokens };
      } catch (error) {
        const isRateLimit = (error as { status?: number }).status === 429;
        const isServerErr = ((error as { status?: number }).status || 0) >= 500;

        if ((isRateLimit || isServerErr) && attempt < maxRetries) {
          console.warn(
            `[embeddings] API attempt ${attempt} failed with status ${(error as { status?: number }).status}. Retrying in ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          console.error(
            `[embeddings] Failed to generate embeddings after ${attempt} attempts:`,
            error
          );
          throw error;
        }
      }
    }

    throw new Error('Failed to generate embeddings: max retries exceeded');
  }

  /**
   * Batches chunks into groups of up to batchSize to minimize HTTP overhead.
   */
  public async generateBatchEmbeddings(
    texts: string[],
    batchSize = 100
  ): Promise<BatchEmbeddingResult> {
    if (texts.length === 0) {
      return { embeddings: [], totalTokens: 0 };
    }

    const allEmbeddings: number[][] = [];
    let accumulatedTokens = 0;

    for (let i = 0; i < texts.length; i += batchSize) {
      const batchTexts = texts.slice(i, i + batchSize);
      console.log(
        `[embeddings] Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(texts.length / batchSize)} (${batchTexts.length} chunks)`
      );

      const { embeddings, totalTokens } = await this.createEmbeddingWithRetry(batchTexts);

      allEmbeddings.push(...embeddings);
      accumulatedTokens += totalTokens;
    }

    console.log(
      `[embeddings] Completed embedding generation for ${texts.length} chunks. Total tokens used: ${accumulatedTokens}`
    );

    return {
      embeddings: allEmbeddings,
      totalTokens: accumulatedTokens,
    };
  }

  /**
   * Generates a single embedding (used for RAG query embedding in Phase 1d).
   */
  public async generateQueryEmbedding(query: string): Promise<number[]> {
    const { embeddings } = await this.createEmbeddingWithRetry([query]);
    const first = embeddings[0];
    if (!first) {
      throw new Error('Embedding service returned empty query embedding');
    }
    return first;
  }

  /**
   * Deterministic mock vector generation for local offline environments.
   */
  private generateMockEmbedding(text: string): number[] {
    const vector: number[] = new Array(this.dimensions).fill(0);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    let norm = 0;
    for (let i = 0; i < this.dimensions; i++) {
      const val = Math.sin(hash + i);
      vector[i] = val;
      norm += val * val;
    }

    norm = Math.sqrt(norm);
    return vector.map((v) => v / norm);
  }
}

export const embeddingService = new EmbeddingService();
