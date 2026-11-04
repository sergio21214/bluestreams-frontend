'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useSession } from '@/lib/useSession';

const PUBLIC_ROUTES = ['/login', '/register'];
const PUBLIC_PREFIXES = ['/register'];

const NO_PROFILE_ROUTES = ['/profiles', '/admin'];
const ADMIN_ROUTES = ['/admin'];

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

  const { token, profileId, role } = useSession();

  const isPublic = matches(
    pathname,
    PUBLIC_ROUTES,
    PUBLIC_PREFIXES
  );

  const isAdminRoute = matches(pathname, ADMIN_ROUTES);
  const needsProfile = !matches(pathname, NO_PROFILE_ROUTES);

  const allowed =
    isPublic ||
    (!!token &&
      (!isAdminRoute || role === 'ADMIN') &&
      (!needsProfile || !!profileId));

  useEffect(() => {
    if (isPublic) {
      return;
    }

    if (!token) {
      router.replace('/login');
      return;
    }

    if (isAdminRoute && role !== 'ADMIN') {
      router.replace('/');
      return;
    }

    if (needsProfile && !profileId) {
      router.replace('/profiles');
    }
  }, [
    isPublic,
    isAdminRoute,
    needsProfile,
    token,
    profileId,
    role,
    router
  ]);

  if (!allowed) {
    return <LoadingScreen />;
  }

  return children;
}
