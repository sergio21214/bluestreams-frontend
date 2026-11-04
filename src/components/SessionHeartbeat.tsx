'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import {
  clearSession,
  getToken,
  hasAnyCredential
} from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const PUBLIC_ROUTES = ['/login', '/register'];

export default function SessionHeartbeat() {
  const pathname = usePathname();

  useEffect(() => {
    if (PUBLIC_ROUTES.includes(pathname)) {
      return;
    }

    if (!hasAnyCredential()) {
      return;
    }

    async function heartbeat() {
      try {
        const token = getToken();

        const response = await fetch(`${API_URL}/auth/check`, {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.status === 401) {
          clearSession();

          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      } catch (error) {
        console.error('Heartbeat failed', error);
      }
    }

    heartbeat();

    const timer = setInterval(heartbeat, 20 * 60 * 1000);

    return () => clearInterval(timer);
  }, [pathname]);

  return null;
}
