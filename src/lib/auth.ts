'use client';

export type SessionPayload = {
  sub?: string;
  userId?: number;
  groups?: string | string[];
  exp?: number;
  [key: string]: unknown;
};

const TOKEN_KEY = 'token';
const PROFILE_ID_KEY = 'profileId';
const PROFILE_NAME_KEY = 'profileName';

export const SESSION_EVENT = 'bluestreams:session';

function notifySessionChanged(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(SESSION_EVENT));
}

function safeLocalStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export function getToken(): string | null {
  return safeLocalStorage()?.getItem(TOKEN_KEY) ?? null;
}

export function setToken(token: string): void {
  safeLocalStorage()?.setItem(TOKEN_KEY, token);
  notifySessionChanged();
}

export function getProfileId(): string | null {
  return safeLocalStorage()?.getItem(PROFILE_ID_KEY) ?? null;
}

export function getProfileName(): string | null {
  return safeLocalStorage()?.getItem(PROFILE_NAME_KEY) ?? null;
}

export function setProfile(id: string | number, name?: string): void {
  const storage = safeLocalStorage();

  if (!storage) {
    return;
  }

  storage.setItem(PROFILE_ID_KEY, String(id));

  if (name) {
    storage.setItem(PROFILE_NAME_KEY, name);
  }

  notifySessionChanged();
}

export function clearSession(): void {
  const storage = safeLocalStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(TOKEN_KEY);
  storage.removeItem(PROFILE_ID_KEY);
  storage.removeItem(PROFILE_NAME_KEY);

  notifySessionChanged();
}

export function hasAnyCredential(): boolean {
  return getToken() !== null;
}

function decodeBase64Url(input: string): string {
  const padded =
    input.length % 4 === 0
      ? input
      : input + '='.repeat(4 - (input.length % 4));

  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');

  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(
          (char) =>
            '%' +
            ('00' + char.charCodeAt(0).toString(16)).slice(-2)
        )
        .join('')
    );
  } catch {
    return atob(base64);
  }
}

export function getTokenPayload(
  token: string | null = getToken()
): SessionPayload | null {
  if (!token) {
    return null;
  }

  const parts = token.split('.');

  if (parts.length < 2) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(parts[1])) as SessionPayload;
  } catch {
    return null;
  }
}

export function getRole(token?: string | null): string | null {
  const payload = getTokenPayload(token ?? getToken());

  if (!payload) {
    return null;
  }

  const groups = payload.groups;

  if (Array.isArray(groups)) {
    return groups[0] ?? null;
  }

  return typeof groups === 'string' ? groups : null;
}

export function isAdmin(): boolean {
  return getRole() === 'ADMIN';
}

export function isTokenExpired(token?: string | null): boolean {
  const payload = getTokenPayload(token ?? getToken());

  if (!payload?.exp) {
    return false;
  }

  return payload.exp * 1000 <= Date.now();
}
