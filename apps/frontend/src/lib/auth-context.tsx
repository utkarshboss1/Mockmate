'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar?: string | null;
  activePlan?: string | null;
  planExpiresAt?: string | null;
  interviewCredits?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  refreshUser: async () => {},
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

  const updateUser = useCallback((partial: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        const token = stored ? JSON.parse(stored).token : localStorage.getItem('access_token');
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: updated, token }));
      } catch {}
      return updated;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const { api } = await import('@/lib/api');
      const res = await api.get('/users/me');
      if (res.data?.data) {
        updateUser(res.data.data);
      }
    } catch {}
  }, [updateUser]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
