'use client';

import { useEffect } from 'react';

import { clearSession, getToken, setToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const MEDIA_URL = process.env.NEXT_PUBLIC_MEDIA_URL ?? '';

const AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh'
];

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function isAuthPath(url: string): boolean {
  return AUTH_PATHS.some((path) => url.includes(path));
}

export default function AuthProvider({
  children
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    let refreshInFlight: Promise<string | null> | null = null;

    async function refreshToken(): Promise<string | null> {
      if (refreshInFlight) {
        return refreshInFlight;
      }

      refreshInFlight = (async () => {
        try {
          const response = await originalFetch(
            `${API_URL}/auth/refresh`,
            {
              method: 'POST',
              credentials: 'include'
            }
          );

          if (!response.ok) {
            return null;
          }

          const data = (await response.json()) as {
            token?: string;
          };

          if (!data.token) {
            return null;
          }

          setToken(data.token);

          return data.token;
        } catch {
          return null;
        } finally {
          refreshInFlight = null;
        }
      })();

      return refreshInFlight;
    }

    async function intercept(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const url = resolveUrl(input);

      const isApi = !!API_URL && url.startsWith(API_URL);
      const isMedia = !!MEDIA_URL && url.startsWith(MEDIA_URL);
      const isAuth = isAuthPath(url);

      const headers = new Headers(
        init?.headers ??
          (input instanceof Request ? input.headers : undefined)
      );

      const token = getToken();

      if (isApi && !isMedia && !isAuth && token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const response = await originalFetch(input, {
        ...init,
        headers
      });

      if (
        response.status !== 401 ||
        !isApi ||
        isMedia ||
        isAuth
      ) {
        return response;
      }

      const nextToken = await refreshToken();

      if (!nextToken) {
        clearSession();

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return response;
      }

      headers.set('Authorization', `Bearer ${nextToken}`);

      return originalFetch(input, {
        ...init,
        headers
      });
    }

    window.fetch = intercept;

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return children;
}
