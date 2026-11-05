'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  SESSION_EVENT,
  getProfileId,
  getRole,
  getToken
} from '@/lib/auth';

const PUBLIC_ROUTES = ['/login', '/register'];
const PUBLIC_PREFIXES = ['/register'];

const NO_PROFILE_ROUTES = ['/profiles', '/admin'];
const ADMIN_ROUTES = ['/admin'];

type ClientSession = {
  token: string | null;
  profileId: string | null;
  role: string | null;
};

function readSession(): ClientSession {
  const token = getToken();

  return {
    token,
    profileId: getProfileId(),
    role: getRole(token)
  };
}

function matches(
  pathname: string,
  routes: string[],
  prefixes: string[] = []
): boolean {
  return (
    routes.some(
      (route) =>
        pathname === route || pathname.startsWith(`${route}/`)
    ) ||
    prefixes.some((prefix) => pathname.startsWith(prefix))
  );
}

function LoadingScreen() {
  return (
    <div className="flex h-full min-h-screen items-center justify-center bg-[#050b18] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />
        <span className="text-sm text-zinc-400">
          Loading BlueStreams...
        </span>
      </div>
    </div>
  );
}

export default function AuthGuard({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [session, setSession] =
    useState<ClientSession | null>(null);

  /*
   * Read the session only on the client, after hydration. This avoids
   * redirecting on the server-render snapshot while the browser still
   * has a valid token in localStorage.
   */
  useEffect(() => {
    const update = () => setSession(readSession());

    update();

    window.addEventListener(SESSION_EVENT, update);
    window.addEventListener('storage', update);

    return () => {
      window.removeEventListener(SESSION_EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, [pathname]);

  const isPublic = matches(
    pathname,
    PUBLIC_ROUTES,
    PUBLIC_PREFIXES
  );

  const isAdminRoute = matches(pathname, ADMIN_ROUTES);
  const needsProfile = !matches(pathname, NO_PROFILE_ROUTES);

  const allowed =
    isPublic ||
    (session !== null &&
      !!session.token &&
      (!isAdminRoute || session.role === 'ADMIN') &&
      (!needsProfile || !!session.profileId));

  useEffect(() => {
    if (isPublic || session === null) {
      return;
    }

    if (!session.token) {
      router.replace('/login');
      return;
    }

    if (isAdminRoute && session.role !== 'ADMIN') {
      router.replace('/');
      return;
    }

    if (needsProfile && !session.profileId) {
      router.replace('/profiles');
    }
  }, [
    isPublic,
    isAdminRoute,
    needsProfile,
    session,
    router
  ]);

  if (!allowed) {
    return <LoadingScreen />;
  }

  return children;
}
