export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}
