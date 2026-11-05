'use client';

import { getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type AdminTab =
  | 'overview'
  | 'users'
  | 'profiles'
  | 'iptv'
  | 'queue'
  | 'music';

export type AdminUser = {
  id: number;
  username: string;
  email?: string | null;
  role?: string | null;
  enabled?: boolean | null;
};

export type AdminProfile = {
  id: number;
  userId: number;
  profileName: string;
  isKidsProfile?: boolean | null;
  avatarUrl?: string | null;
};

export type IptvAccount = {
  id: number;
  label?: string | null;
  type?: string | null;
  status?: string | null;
  enabled?: boolean;
  isDefault?: boolean;
  expiresAt?: string | null;
  lastCheckedAt?: string | null;
  lastHttpStatus?: number | null;
  latencyMs?: number | null;
  lastError?: string | null;
  url?: string | null;
};

export type IptvStats = {
  total?: number;
  active?: number;
  dead?: number;
  unknown?: number;
  expired?: number;
};

export type QueueStatus = {
  processing: string[];
  waiting: string[];
  failed: string[];
};

async function adminFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store'
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const text = await response.text();

      if (text) {
        message = text;
      }
    } catch {
      // Keep the status message.
    }

    throw new Error(message);
  }

  return response;
}

export async function adminJson<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await adminFetch(path, init);
  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function adminText(
  path: string,
  init?: RequestInit
): Promise<string> {
  const response = await adminFetch(path, init);
  return response.text();
}

export function accountHost(account: IptvAccount): string {
  if (!account.url) {
    return '—';
  }

  try {
    return new URL(account.url).host;
  } catch {
    return account.label || '—';
  }
}

export function statusTone(status?: string | null): string {
  switch ((status ?? '').toUpperCase()) {
    case 'ACTIVE':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20';

    case 'DEAD':
      return 'bg-red-500/15 text-red-300 border-red-500/20';

    case 'EXPIRED':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/20';

    default:
      return 'bg-zinc-500/15 text-zinc-300 border-zinc-500/20';
  }
}
