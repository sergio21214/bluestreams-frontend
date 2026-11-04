'use client';

import { useSyncExternalStore } from 'react';

import {
  SESSION_EVENT,
  getProfileId,
  getProfileName,
  getRole,
  getToken
} from './auth';

export type SessionInfo = {
  token: string | null;
  profileId: string | null;
  profileName: string;
  role: string | null;
};

const SERVER_SNAPSHOT: SessionInfo = {
  token: null,
  profileId: null,
  profileName: 'Profile',
  role: null
};

let cachedKey = '';
let cachedSnapshot: SessionInfo = SERVER_SNAPSHOT;

function getSnapshot(): SessionInfo {
  const token = getToken();
  const profileId = getProfileId();
  const profileName = getProfileName() ?? 'Profile';
  const role = getRole(token);

  const key = `${token}|${profileId}|${profileName}|${role}`;

  if (key !== cachedKey) {
    cachedKey = key;
    cachedSnapshot = {
      token,
      profileId,
      profileName,
      role
    };
  }

  return cachedSnapshot;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  window.addEventListener(SESSION_EVENT, callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(SESSION_EVENT, callback);
  };
}

export function useSession(): SessionInfo {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => SERVER_SNAPSHOT
  );
}
