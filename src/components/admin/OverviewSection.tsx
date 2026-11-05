'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  adminJson,
  adminText,
  type AdminProfile,
  type AdminTab,
  type AdminUser,
  type IptvStats,
  type QueueStatus
} from '@/lib/admin';

import {
  Alert,
  Button,
  Card,
  SectionTitle,
  Spinner,
  StatCard
} from './ui';

type OverviewData = {
  users: AdminUser[];
  profiles: AdminProfile[];
  queue: QueueStatus;
  iptv: IptvStats;
};

export default function OverviewSection({
  onNavigate
}: {
  onNavigate: (tab: AdminTab) => void;
}) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [users, profiles, queue, iptv] = await Promise.all([
        adminJson<AdminUser[]>('/admin/users'),
        adminJson<AdminProfile[]>('/admin/profiles'),
        adminJson<QueueStatus>('/admin/queue'),
        adminJson<IptvStats>('/admin/iptv/accounts/stats')
      ]);

      setData({ users, profiles, queue, iptv });
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load admin overview'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(key: string, path: string) {
    setBusy(key);
    setMessage('');
    setError('');

    try {
      const text = await adminText(path, { method: 'POST' });

      setMessage(text || 'Action started.');

      if (key !== 'retry') {
        window.setTimeout(() => load(), 1500);
      } else {
        load();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Action failed'
      );
    } finally {
      setBusy('');
    }
  }

  if (loading) {
    return (
      <Card>
        <Spinner label="Loading overview..." />
      </Card>
    );
  }

  if (!data) {
    return <Alert tone="error">{error}</Alert>;
  }

  return (
    <div className="space-y-6">

      {message && <Alert tone="success">{message}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Users"
          value={data.users.length}
          hint="Accounts with access"
          tone="blue"
        />
        <StatCard
          label="Profiles"
          value={data.profiles.length}
          hint="Viewing profiles"
          tone="green"
        />
        <StatCard
          label="IPTV accounts"
          value={data.iptv.total ?? 0}
          hint={`${data.iptv.active ?? 0} active`}
          tone="amber"
        />
        <StatCard
          label="Queue"
          value={
            data.queue.processing.length +
            data.queue.waiting.length
          }
          hint={`${data.queue.failed.length} failed`}
          tone={data.queue.failed.length > 0 ? 'red' : 'slate'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">

        <Card>
          <SectionTitle
            title="Quick actions"
            subtitle="Maintenance tasks for your library and providers."
          />

          <div className="grid gap-3 sm:grid-cols-2">

            <Button
              variant="secondary"
              disabled={busy === 'scan'}
              onClick={() => runAction('scan', '/admin/scan')}
            >
              {busy === 'scan' ? 'Scanning...' : 'Scan media'}
            </Button>

            <Button
              variant="secondary"
              disabled={busy === 'music'}
              onClick={() =>
                runAction('music', '/admin/scan-music')
              }
            >
              {busy === 'music' ? 'Scanning...' : 'Scan music'}
            </Button>

            <Button
              variant="secondary"
              disabled={busy === 'retry'}
              onClick={() => runAction('retry', '/admin/retry')}
            >
              {busy === 'retry'
                ? 'Retrying...'
                : `Retry failed (${data.queue.failed.length})`}
            </Button>

            <Button
              variant="secondary"
              onClick={() => onNavigate('iptv')}
            >
              Import IPTV playlist
            </Button>

          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">

            <div className="rounded-xl bg-black/20 p-3 text-center">
              <p className="text-2xl font-bold text-blue-300">
                {data.queue.processing.length}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-zinc-500">
                Processing
              </p>
            </div>

            <div className="rounded-xl bg-black/20 p-3 text-center">
              <p className="text-2xl font-bold text-amber-300">
                {data.queue.waiting.length}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-zinc-500">
                Waiting
              </p>
            </div>

            <div className="rounded-xl bg-black/20 p-3 text-center">
              <p className="text-2xl font-bold text-red-300">
                {data.queue.failed.length}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-zinc-500">
                Failed
              </p>
            </div>

          </div>
        </Card>

        <Card>
          <SectionTitle
            title="People"
            subtitle="Latest accounts in the system."
            action={
              <Button
                variant="ghost"
                onClick={() => onNavigate('users')}
              >
                Manage
              </Button>
            }
          />

          <div className="space-y-2">

            {data.users.slice(0, 6).map((user) => (
              <button
                type="button"
                key={user.id}
                onClick={() => onNavigate('users')}
                className="flex w-full items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 text-left transition hover:bg-white/[0.07]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-300">
                  {user.username.charAt(0).toUpperCase()}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">
                    {user.username}
                  </span>
                  <span className="block truncate text-xs text-zinc-500">
                    {user.email || 'No email'}
                  </span>
                </span>

                <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  {user.role}
                </span>
              </button>
            ))}

            {data.users.length === 0 && (
              <p className="py-8 text-center text-sm text-zinc-500">
                No users yet.
              </p>
            )}

          </div>
        </Card>

      </div>

      <Card>
        <SectionTitle
          title="IPTV health"
          subtitle="Account status across all imported providers."
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">

          {[
            ['Total', data.iptv.total ?? 0, 'text-white'],
            ['Active', data.iptv.active ?? 0, 'text-emerald-300'],
            ['Dead', data.iptv.dead ?? 0, 'text-red-300'],
            ['Unknown', data.iptv.unknown ?? 0, 'text-zinc-300'],
            ['Expired', data.iptv.expired ?? 0, 'text-amber-300']
          ].map(([label, value, tone]) => (
            <div
              key={String(label)}
              className="rounded-xl bg-black/20 p-3 text-center"
            >
              <p className={`text-2xl font-bold ${tone}`}>
                {value}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-zinc-500">
                {label}
              </p>
            </div>
          ))}

        </div>
      </Card>

    </div>
  );
}
