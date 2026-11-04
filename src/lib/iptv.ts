'use client';

import { getToken } from './auth';

export type ActiveIptvAccount = {
  id: number;
  label?: string | null;
  type?: string | null;
  url: string;
  expiresAt?: string | null;
  lastCheckedAt?: string | null;
  latencyMs?: number | null;
  isDefault?: boolean;
};

export type XtreamCategory = {
  category_id?: string;
  category_name?: string;
  stream_count?: number;
};

export type XtreamLiveStream = {
  stream_id: number;
  name: string;
  stream_icon?: string | null;
  category_id?: string | number | null;
  epg_channel_id?: string | null;
};

export type XtreamSeries = {
  series_id: number;
  name: string;
  cover?: string | null;
  plot?: string | null;
  genre?: string | null;
  rating?: string | number | null;
  releaseDate?: string | null;
};

export type XtreamEpisode = {
  id: string | number;
  episode_num?: string | number | null;
  title?: string | null;
  season?: string | number | null;
  container_extension?: string | null;
  info?: {
    plot?: string | null;
    duration?: string | null;
    movie_image?: string | null;
  } | null;
};

export type XtreamSeriesInfo = {
  info?: Record<string, unknown>;
  episodes?: Record<string, XtreamEpisode[]>;
};

export type XtreamMovie = {
  stream_id: number;
  name: string;
  stream_icon?: string | null;
  container_extension?: string | null;
  rating?: string | number | null;
  category_id?: string | number | null;
  plot?: string | null;
};

export type LegacyChannel = {
  id: number;
  name: string;
  logo?: string | null;
  groupName?: string | null;
  streamUrl?: string | null;
};

export type XtreamCredentials = {
  server: string;
  username: string;
  password: string;
};

export function authHeaders(): Record<string, string> {
  const token = getToken();

  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isXtreamAccount(
  account: ActiveIptvAccount
): boolean {
  const type = (account.type ?? '').toUpperCase();

  return (
    type === 'XTREAM' ||
    /get\.php|player_api\.php/i.test(account.url)
  );
}

export function accountTitle(account: ActiveIptvAccount): string {
  if (isXtreamAccount(account)) {
    return 'Xtream';
  }

  const label = account.label || 'IPTV';

  return /chile/i.test(label) ? 'Chile IPTV' : label;
}

export function parseXtreamCredentials(
  account: ActiveIptvAccount
): XtreamCredentials | null {
  try {
    const url = new URL(account.url);

    const username = url.searchParams.get('username');
    const password = url.searchParams.get('password');

    if (!username || !password) {
      return null;
    }

    return {
      server: `${url.protocol}//${url.host}`,
      username,
      password
    };
  } catch {
    return null;
  }
}

export function proxyUrl(url: string): string {
  return `/api/iptv/proxy?url=${encodeURIComponent(url)}`;
}

export async function xtreamApi<T>(
  credentials: XtreamCredentials,
  action: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${credentials.server}/player_api.php`);

  url.searchParams.set('username', credentials.username);
  url.searchParams.set('password', credentials.password);
  url.searchParams.set('action', action);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(proxyUrl(url.toString()), {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Xtream request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

function encode(value: string): string {
  return encodeURIComponent(value);
}

export function xtreamLiveUrl(
  credentials: XtreamCredentials,
  streamId: number | string
): string {
  const upstream = `${credentials.server}/live/${encode(
    credentials.username
  )}/${encode(credentials.password)}/${streamId}.m3u8`;

  return proxyUrl(upstream);
}

export function xtreamMovieUrl(
  credentials: XtreamCredentials,
  streamId: number | string,
  extension?: string | null
): string {
  const ext = cleanExtension(extension);

  const upstream = `${credentials.server}/movie/${encode(
    credentials.username
  )}/${encode(credentials.password)}/${streamId}.${ext}`;

  return proxyUrl(upstream);
}

export function xtreamSeriesUrl(
  credentials: XtreamCredentials,
  episodeId: number | string,
  extension?: string | null
): string {
  const ext = cleanExtension(extension);

  const upstream = `${credentials.server}/series/${encode(
    credentials.username
  )}/${encode(credentials.password)}/${episodeId}.${ext}`;

  return proxyUrl(upstream);
}

function cleanExtension(extension?: string | null): string {
  const cleaned = (extension ?? '').replace(/[^A-Za-z0-9]/g, '');

  return cleaned || 'mp4';
}

export function parseM3u(text: string): LegacyChannel[] {
  const lines = text.split(/\r?\n/);

  const channels: LegacyChannel[] = [];

  let pending: {
    name: string;
    logo?: string;
    group?: string;
  } | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    if (line.startsWith('#EXTINF')) {
      const comma = line.lastIndexOf(',');

      const name =
        comma >= 0 ? line.slice(comma + 1).trim() : 'Channel';

      const logo = /tvg-logo="([^"]*)"/i.exec(line)?.[1];
      const group = /group-title="([^"]*)"/i.exec(line)?.[1];

      pending = { name: name || 'Channel', logo, group };
      continue;
    }

    if (line.startsWith('#')) {
      continue;
    }

    if (pending) {
      channels.push({
        id: channels.length + 1,
        name: pending.name,
        logo: pending.logo,
        groupName: pending.group,
        streamUrl: line
      });

      pending = null;
    }
  }

  return channels;
}
