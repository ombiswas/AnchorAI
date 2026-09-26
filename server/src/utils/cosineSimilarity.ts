/**
 * Computes cosine similarity between two numerical vectors.
 * Returns a value between -1 and 1 (closer to 1 = higher semantic similarity).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  const len = Math.min(vecA.length, vecB.length);

  for (let i = 0; i < len; i++) {
    const a = vecA[i] || 0;
    const b = vecB[i] || 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
