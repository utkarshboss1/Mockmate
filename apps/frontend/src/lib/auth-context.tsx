'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

const AUTH_STORAGE_KEY = 'interviewiq_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
      }
    } catch {
      // Ignore parse errors
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((user: AuthUser, token: string) => {
    setUser(user);
    if (token) {
      localStorage.setItem('access_token', token);
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
