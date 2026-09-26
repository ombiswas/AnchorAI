import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { tokenStorage } from '../lib/tokenStorage';
import type { LoginCredentials, SignupCredentials, User } from '../types/auth.types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(tokenStorage.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize and verify existing session
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const storedToken = tokenStorage.getToken();
      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const { user: fetchedUser } = await api.auth.me();
        if (isMounted) {
          setUser(fetchedUser);
          setToken(storedToken);
        }
      } catch {
        // Token invalid or expired
        tokenStorage.clearToken();
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.auth.login(credentials);
      tokenStorage.setToken(response.token);
      setToken(response.token);
      setUser(response.user);
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to log in';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.auth.signup(credentials);
      tokenStorage.setToken(response.token);
      setToken(response.token);
      setUser(response.user);
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to sign up';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clearToken();
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    error,
    login,
    signup,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
