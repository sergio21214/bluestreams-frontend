'use client';

export type StoredProgress = {
  currentTime: number;
  duration: number;
  updatedAt: number;
};

const PREFIX = 'progress-';

function storage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export function saveProgress(
  mediaId: string | number,
  currentTime: number,
  duration: number
): void {
  const store = storage();

  if (!store) {
    return;
  }

  if (
    !Number.isFinite(currentTime) ||
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    return;
  }

  const value: StoredProgress = {
    currentTime: Math.max(0, Math.floor(currentTime)),
    duration: Math.floor(duration),
    updatedAt: Date.now()
  };

  store.setItem(`${PREFIX}${mediaId}`, JSON.stringify(value));
}

export function readProgress(
  mediaId: string | number
): StoredProgress | null {
  const store = storage();

  if (!store) {
    return null;
  }

  const raw = store.getItem(`${PREFIX}${mediaId}`);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredProgress;

    if (
      !Number.isFinite(parsed.currentTime) ||
      !Number.isFinite(parsed.duration) ||
      parsed.duration <= 0
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function getProgressPercent(mediaId: string | number): number {
  const progress = readProgress(mediaId);

  if (!progress) {
    return 0;
  }

  const percent = (progress.currentTime / progress.duration) * 100;

  return Math.min(100, Math.max(0, percent));
}

export function clearProgress(mediaId: string | number): void {
  storage()?.removeItem(`${PREFIX}${mediaId}`);
}
