export interface CitedSource {
  chunkIndex: number;
  page?: number;
  textSnippet: string;
  similarityScore: number;
}

export interface ChatLatency {
  retrievalMs: number;
  llmMs: number;
  totalMs: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sources?: CitedSource[];
  latency?: ChatLatency;
  timestamp: string;
}

export interface ChatResponse {
  answer: string;
  sources: CitedSource[];
  documentId: string;
  question: string;
  latency: ChatLatency;
}
