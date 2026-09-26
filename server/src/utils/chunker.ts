import { getEncoding } from 'js-tiktoken';

export interface TextChunk {
  text: string;
  chunkIndex: number;
  tokenCount: number;
  page?: number;
}

export interface ChunkerOptions {
  chunkSize?: number; // Target chunk size in tokens (~400 default)
  chunkOverlap?: number; // Overlap in tokens (~50 default)
}

// Initialize tokenizer encoding once (cl100k_base standard for OpenAI embeddings)
const tokenizer = getEncoding('cl100k_base');

/**
 * Splits text into token-aware chunks with accurate token counts and sliding window overlap.
 *
 * @param text The cleaned document text
 * @param options Target chunk size (~400) and overlap (~50)
 * @returns Array of token-aware chunks
 */
export function chunkTextWithTiktoken(text: string, options: ChunkerOptions = {}): TextChunk[] {
  const chunkSize = options.chunkSize || 400;
  const chunkOverlap = options.chunkOverlap || 50;

  if (!text || !text.trim()) {
    return [];
  }

  // Tokenize the full document text using cl100k_base encoding
  const tokens = tokenizer.encode(text);

  if (tokens.length <= chunkSize) {
    return [
      {
        text: text.trim(),
        chunkIndex: 0,
        tokenCount: tokens.length,
      },
    ];
  }

  const chunks: TextChunk[] = [];
  const step = Math.max(1, chunkSize - chunkOverlap);
  let chunkIndex = 0;

  for (let start = 0; start < tokens.length; start += step) {
    const end = Math.min(start + chunkSize, tokens.length);
    const chunkTokens = tokens.slice(start, end);
    const chunkText = tokenizer.decode(chunkTokens).trim();

    if (chunkText.length > 0) {
      chunks.push({
        text: chunkText,
        chunkIndex,
        tokenCount: chunkTokens.length,
      });
      chunkIndex++;
    }

    // Stop if we have reached the end of the tokens array
    if (end >= tokens.length) {
      break;
    }
  }

  return chunks;
}
