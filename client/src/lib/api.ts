import type {
  ApiErrorResponse,
  AuthResponse,
  LoginCredentials,
  SignupCredentials,
  User,
} from '../types/auth.types';
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
}

export const api = new ApiClient();
