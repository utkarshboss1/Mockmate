// ============================================================
// api.ts — Axios Instance
//
// WHY: A configured Axios instance ensures every request
// automatically includes the base URL, credentials, and auth
// token. Interceptors handle token refresh and error
// normalization in one place instead of every component.
// ============================================================

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@interviewiq/shared';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ─── Request Interceptor ─────────────────────────────────────
// Attach access token from localStorage on every request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      let token = localStorage.getItem('access_token');
      if (!token) {
        try {
          const auth = localStorage.getItem('interviewiq_auth');
          if (auth) {
            token = JSON.parse(auth).token;
          }
        } catch {}
      }
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response Interceptor ─────────────────────────────────────
// Normalize errors into a consistent shape
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const status = error.response?.status;

    // 401 — session expired, redirect to login (if not already on login/register)
    if (status === 401 && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('interviewiq_auth');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error as Error);
  },
);

// ─── Helper to extract error message ─────────────────────────
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message ?? 'An unexpected error occurred';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
