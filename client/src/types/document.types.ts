export type DocumentStatus = 'processing' | 'ready' | 'failed';
export type DocumentFileType = 'pdf' | 'image' | 'primer';

export interface StudyDocument {
  _id: string;
  userId: string;
  title: string;
  subject: string;
  fileType: DocumentFileType | string;
  fileUrl: string;
  status: DocumentStatus;
  chunkCount: number;
  errorReason?: string;
  ocrConfidence?: number;
  ocrEngine?: 'tesseract' | 'vision-llm';
  hasLowConfidenceWarning?: boolean;
  createdAt: string;
}

export interface DocumentUploadResponse {
  message: string;
  document: StudyDocument;
}

export interface DocumentListResponse {
  documents: StudyDocument[];
}

export interface CreatePrimerRequest {
  topic: string;
  subject?: string;
}

export interface CreatePrimerResponse {
  message: string;
  document: StudyDocument;
}
