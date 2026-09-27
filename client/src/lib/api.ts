import type {
  ApiErrorResponse,
  AuthResponse,
  LoginCredentials,
  SignupCredentials,
  User,
} from '../types/auth.types';
import type {
  DocumentListResponse,
  DocumentUploadResponse,
  StudyDocument,
} from '../types/document.types';
import { tokenStorage } from './tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = tokenStorage.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const errorData = data as ApiErrorResponse | null;
      const message =
        errorData?.error?.message ||
        `Request failed with status ${response.status} (${response.statusText})`;
      const code = errorData?.error?.code || 'NETWORK_ERROR';
      const error = new Error(message) as Error & { code: string; status: number };
      error.code = code;
      error.status = response.status;
      throw error;
    }

    return data as T;
  }

  public readonly auth = {
    signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
      return this.request<AuthResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },

    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      return this.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },

    me: async (): Promise<{ user: User }> => {
      return this.request<{ user: User }>('/auth/me', {
        method: 'GET',
      });
    },
  };

  public readonly documents = {
    list: async (): Promise<DocumentListResponse> => {
      return this.request<DocumentListResponse>('/documents', {
        method: 'GET',
      });
    },

    getById: async (id: string): Promise<{ document: StudyDocument }> => {
      return this.request<{ document: StudyDocument }>(`/documents/${id}`, {
        method: 'GET',
      });
    },

    createPrimer: async (
      payload: import('../types/document.types').CreatePrimerRequest
    ): Promise<import('../types/document.types').CreatePrimerResponse> => {
      return this.request<import('../types/document.types').CreatePrimerResponse>(
        '/documents/primer',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
    },

    append: async (
      id: string,
      text: string
    ): Promise<import('../types/document.types').AppendSectionResponse> => {
      return this.request<import('../types/document.types').AppendSectionResponse>(
        `/documents/${id}/append`,
        {
          method: 'POST',
          body: JSON.stringify({ text }),
        }
      );
    },

    upload: async (
      file: File,
      title?: string,
      subject?: string,
      onProgress?: (percent: number) => void
    ): Promise<DocumentUploadResponse> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        formData.append('file', file);
        if (title) formData.append('title', title);
        if (subject) formData.append('subject', subject);

        xhr.open('POST', `${API_BASE_URL}/documents/upload`);

        const token = tokenStorage.getToken();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              onProgress(percent);
            }
          };
        }

        xhr.onload = () => {
          let data: unknown;
          try {
            data = JSON.parse(xhr.responseText);
          } catch {
            data = null;
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data as DocumentUploadResponse);
          } else {
            const errorData = data as ApiErrorResponse | null;
            const message =
              errorData?.error?.message ||
              `Upload failed with status ${xhr.status} (${xhr.statusText})`;
            const code = errorData?.error?.code || 'UPLOAD_FAILED';
            const error = new Error(message) as Error & { code: string; status: number };
            error.code = code;
            error.status = xhr.status;
            reject(error);
          }
        };

        xhr.onerror = () => {
          const error = new Error('Network error during file upload') as Error & {
            code: string;
            status: number;
          };
          error.code = 'NETWORK_ERROR';
          error.status = 0;
          reject(error);
        };

        xhr.send(formData);
      });
    },
  };

  public readonly chat = {
    ask: async (
      documentId: string,
      question: string,
      allowFallback = true
    ): Promise<import('../types/chat.types').ChatResponse> => {
      return this.request<import('../types/chat.types').ChatResponse>(`/chat/${documentId}`, {
        method: 'POST',
        body: JSON.stringify({ question, allowFallback }),
      });
    },
  };

  public readonly quiz = {
    generate: async (
      payload: import('../types/quiz.types').GenerateQuizRequest
    ): Promise<import('../types/quiz.types').GenerateQuizResponse> => {
      return this.request<import('../types/quiz.types').GenerateQuizResponse>('/quiz/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    generateFocused: async (
      payload: import('../types/analytics.types').GenerateFocusedQuizRequest
    ): Promise<import('../types/quiz.types').GenerateQuizResponse> => {
      return this.request<import('../types/quiz.types').GenerateQuizResponse>(
        '/quiz/generate-focused',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
    },

    getForTaking: async (
      id: string
    ): Promise<{ quiz: import('../types/quiz.types').QuizForTaking }> => {
      return this.request<{ quiz: import('../types/quiz.types').QuizForTaking }>(`/quiz/${id}`, {
        method: 'GET',
      });
    },

    submit: async (
      id: string,
      answers: import('../types/quiz.types').AnswerSubmission[]
    ): Promise<import('../types/quiz.types').SubmitQuizResponse> => {
      return this.request<import('../types/quiz.types').SubmitQuizResponse>(`/quiz/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      });
    },

    list: async (): Promise<import('../types/quiz.types').QuizListResponse> => {
      return this.request<import('../types/quiz.types').QuizListResponse>('/quiz', {
        method: 'GET',
      });
    },
  };

  public readonly analytics = {
    getWeakTopics: async (
      limit = 10
    ): Promise<{ weakTopics: import('../types/analytics.types').WeakTopic[] }> => {
      return this.request<{ weakTopics: import('../types/analytics.types').WeakTopic[] }>(
        `/analytics/weak-topics?limit=${limit}`,
        {
          method: 'GET',
        }
      );
    },

    getDashboard: async (): Promise<{
      dashboard: import('../types/analytics.types').DashboardData;
    }> => {
      return this.request<{ dashboard: import('../types/analytics.types').DashboardData }>(
        '/analytics/dashboard',
        {
          method: 'GET',
        }
      );
    },
  };
}

export const api = new ApiClient();
