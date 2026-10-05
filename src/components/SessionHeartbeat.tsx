'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { hasAnyCredential } from '@/app/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const PUBLIC_ROUTES = ['/login', '/register'];

export default function SessionHeartbeat() {
    const pathname = usePathname();

    useEffect(() => {
        if (PUBLIC_ROUTES.includes(pathname)) return;
        if (!hasAnyCredential()) return; // nothing to check, avoid a guaranteed 401

        async function heartbeat() {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`${API_URL}/auth/check`, {
                    credentials: 'include',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.status === 401) {
                    localStorage.clear();
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
            } catch (err) {
                console.error('Heartbeat failed', err);
            }
        }

        heartbeat();
        const timer = setInterval(heartbeat, 20 * 60 * 1000);
        return () => clearInterval(timer);
    }, [pathname]);

    return null;
}