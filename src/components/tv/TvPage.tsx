'use client';

import { useEffect, useState } from 'react';

import Navbar from '@/components/Navbar';
import HlsPlayer from '@/components/tv/HlsPlayer';
import LegacyChannels from '@/components/tv/LegacyChannels';
import XtreamBrowser from '@/components/tv/XtreamBrowser';
import {
  accountTitle,
  authHeaders,
  isXtreamAccount,
  type ActiveIptvAccount,
  type VodSubtitleTrack
} from '@/lib/iptv';

type Tab = 'live' | 'series' | 'movies';

const TABS: { id: Tab; label: string }[] = [
  { id: 'live', label: 'Live TV' },
  { id: 'series', label: 'Series' },
  { id: 'movies', label: 'Movies' }
];

type PlayerState = {
  src: string;
  isHls: boolean;
  title: string;
  subtitle?: string;
  subtitles?: VodSubtitleTrack[];
};

export default function TVPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [accounts, setAccounts] = useState<ActiveIptvAccount[]>([]);
  const [selected, setSelected] = useState<ActiveIptvAccount | null>(null);
  const [tab, setTab] = useState<Tab>('live');
  const [player, setPlayer] = useState<PlayerState | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [accountsResponse, providersResponse] = await Promise.all([
          fetch(`${API_URL}/iptv/accounts/active`, {
            headers: authHeaders()
          }),
          fetch(`${API_URL}/iptv/providers`, {
            headers: authHeaders()
          })
        ]);

        if (!accountsResponse.ok) {
          throw new Error(`HTTP ${accountsResponse.status}`);
        }

        const activeAccounts =
          (await accountsResponse.json()) as ActiveIptvAccount[];

        const providers = providersResponse.ok
          ? ((await providersResponse.json()) as {
              id: number;
              name?: string | null;
              url?: string | null;
            }[])
          : [];

        const list = Array.isArray(activeAccounts)
          ? [...activeAccounts]
          : [];

        const knownUrls = new Set(
          list.map((account) => account.url.replace(/\/+$/, ''))
        );

        providers.forEach((provider) => {
          if (!provider.url || !/\.m3u$/i.test(provider.url)) {
            return;
          }

          const key = provider.url.replace(/\/+$/, '');

          if (knownUrls.has(key)) {
            return;
          }

          knownUrls.add(key);

          list.push({
            id: -provider.id,
            label: provider.name ?? 'IPTV',
            type: 'M3U',
            url: provider.url,
            isDefault: false
          });
        });

        if (!cancelled) {
          setAccounts(list);
          setLoading(false);
        }
      } catch (err) {
        console.error('Could not load IPTV accounts', err);

        if (!cancelled) {
          setError('Could not load your active IPTV accounts.');
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [API_URL]);

  function selectAccount(account: ActiveIptvAccount) {
    setSelected(account);
    setTab('live');
    setPlayer(null);
  }

  function play(
    src: string,
    isHls: boolean,
    title: string,
    subtitle?: string,
    subtitles?: VodSubtitleTrack[]
  ) {
    setPlayer({ src, isHls, title, subtitle, subtitles });
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#050b18] px-4 pb-16 pt-24 text-white sm:px-6 lg:px-10">

        {!selected ? (
          <>
            <header className="mb-8">

              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400/80">
                Live TV
              </p>

              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                Choose a provider
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                Active IPTV accounts available for your profile.
              </p>

            </header>

            {loading ? (
              <div className="flex justify-center py-24">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />
              </div>
            ) : error ? (
              <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-5 text-sm text-red-300">
                {error}
              </p>
            ) : accounts.length === 0 ? (
              <p className="rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-16 text-center text-sm text-zinc-500">
                No active IPTV accounts. Add one from the admin panel.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

                {accounts.map((account) => (
                  <button
                    type="button"
                    key={`${account.id}-${account.url}`}
                    onClick={() => selectAccount(account)}
                    className="
                      group
                      flex
                      items-center
                      gap-4
                      rounded-2xl
                      border
                      border-white/5
                      bg-gradient-to-br
                      from-white/[0.06]
                      to-white/[0.02]
                      p-5
                      text-left
                      transition
                      hover:border-blue-500/40
                      hover:from-blue-600/20
                      hover:to-blue-900/10
                    "
                  >

                    <span
                      className="
                        flex
                        h-14
                        w-14
                        shrink-0
                        items-center
                        justify-center
                        rounded-2xl
                        bg-gradient-to-br
                        from-blue-500
                        to-blue-700
                        text-xl
                        font-bold
                        shadow-lg
                        shadow-blue-900/40
                      "
                    >
                      {isXtreamAccount(account) ? 'X' : 'TV'}
                    </span>

                    <span className="min-w-0 flex-1">

                      <span className="flex items-center gap-2">

                        <span className="truncate text-lg font-bold">
                          {accountTitle(account)}
                        </span>

                        {account.isDefault && (
                          <span className="shrink-0 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-300">
                            Default
                          </span>
                        )}

                      </span>

                      <span className="mt-1 block truncate text-xs text-zinc-400">
                        {isXtreamAccount(account)
                          ? 'Live TV • Series • Movies'
                          : 'Live channels'}
                      </span>

                      {account.label && isXtreamAccount(account) && (
                        <span className="mt-1 block truncate text-[11px] text-zinc-500">
                          {account.label}
                        </span>
                      )}

                    </span>

                    <span className="shrink-0 text-2xl text-zinc-600 transition group-hover:text-blue-400">
                      →
                    </span>

                  </button>
                ))}

              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

              <div className="flex items-center gap-3">

                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setPlayer(null);
                  }}
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-white/10
                    bg-white/5
                    text-zinc-300
                    transition
                    hover:bg-white/10
                    hover:text-white
                  "
                  aria-label="Back to providers"
                >
                  ←
                </button>

                <div>
                  <h1 className="text-2xl font-bold">
                    {accountTitle(selected)}
                  </h1>

                  <p className="text-xs text-zinc-400">
                    {isXtreamAccount(selected)
                      ? 'Xtream account'
                      : 'Live TV playlist'}
                    {selected.label ? ` • ${selected.label}` : ''}
                  </p>
                </div>

              </div>

            </div>

            {isXtreamAccount(selected) && (
              <div className="mb-6 flex gap-2">

                {TABS.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setTab(item.id);
                      setPlayer(null);
                    }}
                    className={`
                      rounded-full
                      px-5
                      py-2
                      text-sm
                      font-semibold
                      transition
                      ${
                        tab === item.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    {item.label}
                  </button>
                ))}

              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)]">

              <section className="order-2 min-w-0 lg:order-1">

                {isXtreamAccount(selected) ? (
                  <XtreamBrowser
                    account={selected}
                    tab={tab}
                    onPlay={play}
                  />
                ) : (
                  <LegacyChannels
                    account={selected}
                    onPlay={play}
                  />
                )}

              </section>

              <aside className="order-1 self-start lg:order-2 lg:sticky lg:top-24">

                <HlsPlayer
                  src={player?.src ?? null}
                  isHls={player?.isHls ?? false}
                  title={player?.title}
                  subtitle={player?.subtitle}
                  subtitles={player?.subtitles}
                />

              </aside>

            </div>
          </>
        )}

      </main>
    </>
  );
}
