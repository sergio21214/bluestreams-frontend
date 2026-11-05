'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  accountHost,
  adminJson,
  type IptvAccount,
  type IptvStats
} from '@/lib/admin';

import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  SectionTitle,
  Spinner,
  StatCard
} from './ui';

type ImportResult = {
  total?: number;
  inserted?: number;
  updated?: number;
};

const STATUS_FILTERS = [
  'ALL',
  'ACTIVE',
  'DEAD',
  'EXPIRED',
  'UNKNOWN'
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

function badgeTone(
  status?: string | null
): 'green' | 'red' | 'amber' | 'slate' {
  switch ((status ?? '').toUpperCase()) {
    case 'ACTIVE':
      return 'green';

    case 'DEAD':
      return 'red';

    case 'EXPIRED':
      return 'amber';

    default:
      return 'slate';
  }
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function IptvSection() {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [accounts, setAccounts] = useState<IptvAccount[]>([]);
  const [stats, setStats] = useState<IptvStats>({});
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState(50);

  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [checkingAll, setCheckingAll] = useState(false);
  const [checkingId, setCheckingId] = useState<number | null>(
    null
  );
  const [updatingId, setUpdatingId] = useState<number | null>(
    null
  );

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [accountData, statData] = await Promise.all([
        adminJson<IptvAccount[]>('/admin/iptv/accounts'),
        adminJson<IptvStats>('/admin/iptv/accounts/stats')
      ]);

      setAccounts(accountData);
      setStats(statData);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load IPTV accounts'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function importPlaylist(content: string) {
    if (!content.trim()) {
      setError('Paste a playlist or choose a file first.');
      return;
    }

    setImporting(true);
    setMessage('');
    setError('');

    try {
      const result = await adminJson<ImportResult>(
        '/admin/iptv/accounts/import',
        {
          method: 'POST',
          body: JSON.stringify({ content })
        }
      );

      setImportText('');
      setMessage(
        `Playlist imported: ${result.total ?? 0} found, ${
          result.inserted ?? 0
        } new, ${result.updated ?? 0} updated.`
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Import failed'
      );
    } finally {
      setImporting(false);
    }
  }

  async function handleFile(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const text = await file.text();
    await importPlaylist(text);

    event.target.value = '';
  }

  async function checkAll() {
    setCheckingAll(true);
    setMessage('');
    setError('');

    try {
      await adminJson('/admin/iptv/accounts/check', {
        method: 'POST'
      });

      setMessage(
        'Liveness check started. Accounts will update as checks finish.'
      );

      window.setTimeout(() => load(), 5000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Check failed';

      setError(
        message.includes('already running')
          ? 'A liveness check is already running.'
          : message
      );
    } finally {
      setCheckingAll(false);
    }
  }

  async function checkOne(account: IptvAccount) {
    setCheckingId(account.id);
    setMessage('');
    setError('');

    try {
      await adminJson<IptvAccount>(
        `/admin/iptv/accounts/${account.id}/check`,
        { method: 'POST' }
      );

      setMessage(`Checked ${account.label || accountHost(account)}.`);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Check failed'
      );
    } finally {
      setCheckingId(null);
    }
  }

  async function makeDefault(account: IptvAccount) {
    setUpdatingId(account.id);
    setMessage('');
    setError('');

    try {
      await adminJson<IptvAccount>(
        `/admin/iptv/accounts/${account.id}/default`,
        { method: 'PUT' }
      );

      setMessage(
        `${account.label || accountHost(account)} is now the default account.`
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not set default'
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const term = search.trim().toLowerCase();

  const filtered = accounts.filter((account) => {
    const matchesStatus =
      filter === 'ALL' ||
      (account.status ?? '').toUpperCase() === filter;

    if (!matchesStatus) {
      return false;
    }

    if (!term) {
      return true;
    }

    return (
      (account.label ?? '').toLowerCase().includes(term) ||
      (account.type ?? '').toLowerCase().includes(term) ||
      accountHost(account).toLowerCase().includes(term)
    );
  });

  const shown = filtered.slice(0, visible);

  return (
    <div className="space-y-6">

      {message && <Alert tone="success">{message}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Total" value={stats.total ?? 0} />
        <StatCard
          label="Active"
          value={stats.active ?? 0}
          tone="green"
        />
        <StatCard label="Dead" value={stats.dead ?? 0} tone="red" />
        <StatCard
          label="Unknown"
          value={stats.unknown ?? 0}
          tone="slate"
        />
        <StatCard
          label="Expired"
          value={stats.expired ?? 0}
          tone="amber"
        />
      </div>

      <Card>

        <SectionTitle
          title="Import playlist"
          subtitle="Paste an M3U playlist or select a file. Duplicate URLs are updated, not duplicated."
        />

        <textarea
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          placeholder="Paste playlist content here..."
          rows={5}
          className="w-full rounded-xl border border-white/10 bg-[#0a1322] px-3 py-2.5 font-mono text-xs text-white outline-none transition placeholder:text-zinc-600 focus:border-blue-500/60"
        />

        <div className="mt-3 flex flex-wrap justify-end gap-2">

          <Button
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
          >
            Choose file
          </Button>

          <Button
            onClick={() => importPlaylist(importText)}
            disabled={importing || !importText.trim()}
          >
            {importing ? 'Importing...' : 'Import playlist'}
          </Button>

          <input
            ref={fileRef}
            type="file"
            accept=".m3u,.m3u8,.txt"
            hidden
            onChange={handleFile}
          />

        </div>

      </Card>

      <Card>

        <SectionTitle
          title="Accounts"
          subtitle={`${filtered.length} matching account${
            filtered.length === 1 ? '' : 's'
          }`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setVisible(50);
                }}
                placeholder="Search label or host..."
                className="w-52 rounded-xl border border-white/10 bg-[#0a1322] px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-blue-500/60"
              />

              <Button
                variant="secondary"
                onClick={load}
              >
                Refresh
              </Button>

              <Button
                onClick={checkAll}
                disabled={checkingAll}
              >
                {checkingAll ? 'Checking...' : 'Check all'}
              </Button>
            </div>
          }
        />

        <div className="mb-4 flex flex-wrap gap-2">

          {STATUS_FILTERS.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => {
                setFilter(item);
                setVisible(50);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === item
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              {item === 'ALL' ? 'All' : item}
            </button>
          ))}

        </div>

        {loading ? (
          <Spinner label="Loading accounts..." />
        ) : shown.length === 0 ? (
          <EmptyState
            title="No accounts found"
            description="Import a playlist above or adjust the filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">

              <table className="w-full min-w-[980px] text-left text-sm">

                <thead>
                  <tr className="text-xs uppercase tracking-wide text-zinc-500">
                    <th className="pb-3 font-semibold">Account</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Expires</th>
                    <th className="pb-3 font-semibold">Latency</th>
                    <th className="pb-3 font-semibold">
                      Last checked
                    </th>
                    <th className="pb-3 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">

                  {shown.map((account) => (
                    <tr key={account.id} className="align-middle">

                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white">
                            {account.label || 'Untitled'}
                          </p>

                          {account.isDefault && (
                            <Badge tone="blue">Default</Badge>
                          )}

                          {account.enabled === false && (
                            <Badge tone="slate">Disabled</Badge>
                          )}
                        </div>

                        <p className="mt-0.5 text-xs text-zinc-500">
                          {accountHost(account)}
                        </p>
                      </td>

                      <td className="py-3 pr-4 text-zinc-300">
                        {account.type || '—'}
                      </td>

                      <td className="py-3 pr-4">
                        <Badge tone={badgeTone(account.status)}>
                          {account.status || 'UNKNOWN'}
                        </Badge>
                      </td>

                      <td className="py-3 pr-4 text-zinc-300">
                        {account.expiresAt || '—'}
                      </td>

                      <td className="py-3 pr-4 text-zinc-300">
                        {account.latencyMs != null
                          ? `${account.latencyMs} ms`
                          : '—'}
                      </td>

                      <td className="py-3 pr-4 text-zinc-400">
                        {formatDate(account.lastCheckedAt)}
                      </td>

                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">

                          <Button
                            variant="secondary"
                            disabled={checkingId === account.id}
                            onClick={() => checkOne(account)}
                          >
                            {checkingId === account.id
                              ? 'Checking...'
                              : 'Check'}
                          </Button>

                          {!account.isDefault && (
                            <Button
                              variant="secondary"
                              disabled={
                                updatingId === account.id ||
                                (account.status ?? '').toUpperCase() !==
                                  'ACTIVE'
                              }
                              onClick={() => makeDefault(account)}
                            >
                              {updatingId === account.id
                                ? 'Saving...'
                                : 'Set default'}
                            </Button>
                          )}

                        </div>
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

            {filtered.length > shown.length && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="secondary"
                  onClick={() => setVisible((value) => value + 50)}
                >
                  Show 50 more
                </Button>
              </div>
            )}
          </>
        )}

      </Card>

    </div>
  );
}
