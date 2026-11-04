'use client';

import { useEffect, useState } from 'react';

import {
  authHeaders,
  parseM3u,
  type ActiveIptvAccount,
  type LegacyChannel
} from '@/lib/iptv';

type Provider = {
  id: number;
  name?: string | null;
  url?: string | null;
};

export default function LegacyChannels({
  account,
  onPlay
}: {
  account: ActiveIptvAccount;
  onPlay: (
    src: string,
    isHls: boolean,
    title: string,
    subtitle?: string
  ) => void;
}) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [channels, setChannels] = useState<LegacyChannel[]>([]);
  const [legacy, setLegacy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [startingId, setStartingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const providersResponse = await fetch(
          `${API_URL}/iptv/providers`,
          { headers: authHeaders() }
        );

        const providers = providersResponse.ok
          ? ((await providersResponse.json()) as Provider[])
          : [];

        const match = providers.find(
          (provider) =>
            (provider.url &&
              provider.url.replace(/\/+$/, '') ===
                account.url.replace(/\/+$/, '')) ||
            (provider.name &&
              account.label &&
              provider.name.toLowerCase() ===
                account.label.toLowerCase())
        );

        if (match) {
          const response = await fetch(`${API_URL}/iptv/${match.id}`, {
            headers: authHeaders()
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const data = (await response.json()) as LegacyChannel[];

          if (!cancelled) {
            setChannels(data);
            setLegacy(true);
            setLoading(false);
          }

          return;
        }

        const response = await fetch(account.url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const text = await response.text();
        const parsed = parseM3u(text);

        if (!cancelled) {
          setChannels(parsed);
          setLegacy(false);
          setLoading(false);
        }
      } catch (err) {
        console.error('Could not load playlist channels', err);

        if (!cancelled) {
          setError(
            'Could not load this playlist. The provider may block browser requests.'
          );
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [API_URL, account.id, account.url, account.label]);

  async function play(channel: LegacyChannel) {
    if (startingId !== null) {
      return;
    }

    if (!legacy) {
      if (!channel.streamUrl) {
        return;
      }

      onPlay(
        channel.streamUrl,
        /\.m3u8(\?.*)?$/i.test(channel.streamUrl),
        channel.name,
        channel.groupName ?? undefined
      );
      return;
    }

    setStartingId(channel.id);

    try {
      const response = await fetch(
        `${API_URL}/iptv/hls/start/${channel.id}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      onPlay(
        `${API_URL}/iptv/hls/${channel.id}/playlist.m3u8`,
        true,
        channel.name,
        channel.groupName ?? undefined
      );
    } catch (err) {
      console.error('Could not start channel', err);
      setError('Could not start this channel.');
    } finally {
      setStartingId(null);
    }
  }

  const term = search.trim().toLowerCase();

  const filtered = term
    ? channels.filter((channel) =>
        channel.name.toLowerCase().includes(term)
      )
    : channels;

  const visible = filtered.slice(0, 400);

  return (
    <div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h2 className="text-xl font-bold text-white">
            Live channels
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {loading ? 'Loading...' : `${filtered.length} channels`}
          </p>
        </div>

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search channels..."
          className="
            w-full
            rounded-full
            border
            border-white/10
            bg-white/5
            px-4
            py-2.5
            text-sm
            text-white
            outline-none
            placeholder:text-zinc-500
            focus:border-blue-500/60
            sm:w-72
          "
        />

      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
          {error}
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-12 text-center text-sm text-zinc-500">
          No channels found.
        </p>
      ) : (
        <div className="space-y-1.5">

          {visible.map((channel) => (
            <button
              type="button"
              key={`${channel.id}-${channel.name}`}
              onClick={() => play(channel)}
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-xl
                border
                border-transparent
                bg-white/[0.03]
                px-3
                py-2.5
                text-left
                transition
                hover:border-blue-500/30
                hover:bg-white/[0.07]
              "
            >

              {channel.logo &&
              /^https?:\/\//i.test(channel.logo) ? (
                <img
                  src={channel.logo}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                  className="h-10 w-10 shrink-0 rounded-lg bg-white object-contain p-1"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-blue-300">
                  ▶
                </span>
              )}

              <span className="min-w-0 flex-1">

                <span className="block truncate text-sm font-medium text-white">
                  {channel.name}
                </span>

                <span className="block truncate text-xs text-zinc-500">
                  {channel.groupName || 'Live TV'}
                </span>

              </span>

              <span className="shrink-0 text-xs text-blue-400">
                {startingId === channel.id ? 'Starting...' : 'Watch'}
              </span>

            </button>
          ))}

          {filtered.length > visible.length && (
            <p className="pt-2 text-center text-xs text-zinc-500">
              Showing the first {visible.length} channels. Use search to narrow
              the list.
            </p>
          )}

        </div>
      )}

    </div>
  );
}
