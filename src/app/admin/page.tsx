'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import IptvSection from '@/components/admin/IptvSection';
import MusicSection from '@/components/admin/MusicSection';
import OverviewSection from '@/components/admin/OverviewSection';
import ProfilesSection from '@/components/admin/ProfilesSection';
import QueueSection from '@/components/admin/QueueSection';
import UsersSection from '@/components/admin/UsersSection';
import { clearSession } from '@/lib/auth';
import type { AdminTab } from '@/lib/admin';

const TABS: {
  id: AdminTab;
  label: string;
}[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'profiles', label: 'Profiles' },
  { id: 'iptv', label: 'IPTV' },
  { id: 'queue', label: 'Queue' },
  { id: 'music', label: 'Music' }
];

export default function AdminPage() {
  const router = useRouter();

  const [tab, setTab] = useState<AdminTab>('overview');

  function logout() {
    clearSession();
    router.replace('/login');
  }

  return (
    <main className="min-h-screen bg-[#050b18] text-white">

      <header className="border-b border-white/5 bg-[#03070f] px-4 py-4 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4">

          <Link href="/" className="flex items-center gap-3">

            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-lg font-bold shadow-lg shadow-blue-900/40">
              B
            </span>

            <div>
              <p className="text-sm font-bold tracking-wide">
                BlueStreams
              </p>
              <p className="text-[11px] uppercase tracking-[0.25em] text-blue-400/80">
                Admin console
              </p>
            </div>

          </Link>

          <div className="flex flex-wrap items-center gap-2">

            <Link
              href="/admin/music"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              Music downloader
            </Link>

            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              Back to app
            </Link>

            <button
              type="button"
              onClick={logout}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-400 transition hover:bg-white/10 hover:text-white"
            >
              Log out
            </button>

          </div>

        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-6 lg:px-8">

        <div className="mb-6">

          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-400/80">
            Administration
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Control your server
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Manage users and profiles, monitor IPTV providers, and keep your
            media library healthy.
          </p>

        </div>

        <nav className="mb-6 flex gap-2 overflow-x-auto pb-1">

          {TABS.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === item.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}

        </nav>

        {tab === 'overview' && (
          <OverviewSection onNavigate={setTab} />
        )}

        {tab === 'users' && (
          <UsersSection onNavigate={setTab} />
        )}

        {tab === 'profiles' && <ProfilesSection />}

        {tab === 'iptv' && <IptvSection />}

        {tab === 'queue' && <QueueSection />}

        {tab === 'music' && <MusicSection />}

      </div>

    </main>
  );
}
