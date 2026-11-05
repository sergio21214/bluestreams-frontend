'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  adminJson,
  adminText,
  type QueueStatus
} from '@/lib/admin';

import {
  Alert,
  Button,
  Card,
  EmptyState,
  SectionTitle,
  Spinner
} from './ui';

function FileList({
  items,
  empty
}: {
  items: string[];
  empty: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl bg-black/20 px-3 py-6 text-center text-xs text-zinc-500">
        {empty}
      </p>
    );
  }

  return (
    <div className="max-h-72 space-y-1.5 overflow-y-auto">
      {items.map((item, index) => (
        <p
          key={`${item}-${index}`}
          className="truncate rounded-lg bg-black/20 px-3 py-2 font-mono text-[11px] text-zinc-300"
          title={item}
        >
          {item}
        </p>
      ))}
    </div>
  );
}

export default function QueueSection() {
  const [queue, setQueue] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await adminJson<QueueStatus>('/admin/queue');
      setQueue(data);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load queue'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const timer = window.setInterval(load, 5000);

    return () => window.clearInterval(timer);
  }, [load]);

  async function run(key: string, path: string) {
    setBusy(key);
    setMessage('');
    setError('');

    try {
      const text = await adminText(path, { method: 'POST' });
      setMessage(text || 'Action started.');
      await load();
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
        <Spinner label="Loading queue..." />
      </Card>
    );
  }

  return (
    <div className="space-y-6">

      {message && <Alert tone="success">{message}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      <Card>
        <SectionTitle
          title="Processing queue"
          subtitle="Live view of media being processed."
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={busy === 'scan'}
                onClick={() => run('scan', '/admin/scan')}
              >
                {busy === 'scan' ? 'Scanning...' : 'Scan media'}
              </Button>

              <Button
                variant="secondary"
                disabled={busy === 'music'}
                onClick={() => run('music', '/admin/scan-music')}
              >
                {busy === 'music' ? 'Scanning...' : 'Scan music'}
              </Button>

              <Button
                disabled={
                  busy === 'retry' ||
                  (queue?.failed.length ?? 0) === 0
                }
                onClick={() => run('retry', '/admin/retry')}
              >
                {busy === 'retry'
                  ? 'Retrying...'
                  : `Retry failed (${queue?.failed.length ?? 0})`}
              </Button>
            </div>
          }
        />

        <p className="text-xs text-zinc-500">
          Refreshes automatically every 5 seconds.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">

        <Card>
          <SectionTitle
            title="Processing"
            subtitle={`${queue?.processing.length ?? 0} active`}
          />
          <FileList
            items={queue?.processing ?? []}
            empty="Nothing processing right now."
          />
        </Card>

        <Card>
          <SectionTitle
            title="Waiting"
            subtitle={`${queue?.waiting.length ?? 0} queued`}
          />
          <FileList
            items={queue?.waiting ?? []}
            empty="The queue is empty."
          />
        </Card>

        <Card>
          <SectionTitle
            title="Failed"
            subtitle={`${queue?.failed.length ?? 0} failed`}
          />
          <FileList
            items={queue?.failed ?? []}
            empty="No failed items."
          />
        </Card>

      </div>

      {!queue && (
        <EmptyState
          title="No queue data"
          description="Start a scan to populate the processing queue."
        />
      )}

    </div>
  );
}
