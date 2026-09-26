export type DocumentStatus = 'processing' | 'ready' | 'failed';

export interface StudyDocument {
  _id: string;
  userId: string;
  title: string;
  subject: string;
  fileType: string;
  fileUrl: string;
  status: DocumentStatus;
  chunkCount: number;
  errorReason?: string;
  createdAt: string;
}

export interface DocumentUploadResponse {
  message: string;
  document: StudyDocument;
}

export interface DocumentListResponse {
  documents: StudyDocument[];
}
