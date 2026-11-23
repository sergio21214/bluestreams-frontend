'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  adminJson,
  type SystemOverview
} from '@/lib/admin';

import {
  Alert,
  Badge,
  Button,
  Card,
  SectionTitle,
  Spinner,
  StatCard
} from './ui';

function formatNumber(
  value?: number | null,
  digits = 2
): string {
  if (value == null || !Number.isFinite(value)) {
    return '—';
  }

  return value.toFixed(digits);
}

function formatMs(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) {
    return '—';
  }

  return `${value.toFixed(0)} ms`;
}

function formatBytes(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) {
    return '—';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = value;
  let index = 0;

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatPercent(value?: number | null): string {
  if (value == null || !Number.isFinite(value)) {
    return '—';
  }

  return `${value.toFixed(1)}%`;
}

function cpuPercent(value?: number | null): number | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }

  return value <= 1 ? value * 100 : value;
}

function healthTone(
  status?: string
): 'green' | 'red' | 'slate' {
  switch ((status ?? '').toUpperCase()) {
    case 'UP':
      return 'green';

    case 'DOWN':
      return 'red';

    default:
      return 'slate';
  }
}

function serviceTone(up: boolean): 'green' | 'red' {
  return up ? 'green' : 'red';
}

export default function SystemSection() {
  const [data, setData] = useState<SystemOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const result =
        await adminJson<SystemOverview>(
          '/admin/system/overview'
        );

      setData(result);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load system overview'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(load, 0);
    const interval = setInterval(load, 10000);

    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [load]);

  const metrics = data?.metrics;
  const healthStatus = data?.health?.status ?? 'UNKNOWN';
  const services = data?.services ?? [];
  const checks = data?.health?.checks ?? [];
  const upServices = services.filter((service) => service.up).length;
  const grafanaUrl = data?.links?.grafana;
  const uptimeKumaUrl = data?.links?.uptimeKuma;

  return (
    <div className="space-y-6">
      <SectionTitle
        title="System health"
        subtitle="Live backend, database, storage and infrastructure status."
        action={
          <Button variant="secondary" onClick={load}>
            Refresh
          </Button>
        }
      />

      {error && <Alert tone="error">{error}</Alert>}

      {loading && !data && (
        <Spinner label="Loading system overview..." />
      )}

      {data && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={healthTone(healthStatus)}>
              {healthStatus}
            </Badge>

            <span className="text-xs text-zinc-500">
              Updated{' '}
              {data.generatedAt
                ? new Date(data.generatedAt).toLocaleTimeString()
                : '—'}
            </span>

            {metrics?.prometheusAvailable === false && (
              <Badge tone="amber">Prometheus unavailable</Badge>
            )}
          </div>

          {metrics?.prometheusAvailable === false && (
            <Alert tone="info">
              Prometheus is not reachable yet. Metrics and service
              status will appear when the monitoring stack is running.
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="API req/s"
              value={formatNumber(metrics?.requestsPerSecond)}
              hint="5 minute average"
            />

            <StatCard
              label="Errors/s"
              value={formatNumber(metrics?.errorsPerSecond)}
              hint={`${formatPercent(metrics?.errorRatePercent)} error rate`}
              tone="red"
            />

            <StatCard
              label="p95 latency"
              value={formatMs(metrics?.p95LatencyMs)}
              hint={`p99 ${formatMs(metrics?.p99LatencyMs)}`}
              tone="amber"
            />

            <StatCard
              label="Services up"
              value={`${upServices}/${services.length}`}
              hint="Prometheus scrape targets"
              tone="green"
            />

            <StatCard
              label="CPU"
              value={formatPercent(cpuPercent(metrics?.processCpu))}
              hint="Backend process"
              tone="slate"
            />

            <StatCard
              label="JVM heap"
              value={formatBytes(metrics?.heapUsedBytes)}
              hint={`of ${formatBytes(metrics?.heapMaxBytes)}`}
              tone="blue"
            />

            <StatCard
              label="Disk used"
              value={formatPercent(data.disk?.usedPercent)}
              hint={`${formatBytes(data.disk?.usableBytes)} free`}
              tone="amber"
            />

            <StatCard
              label="Music failed"
              value={data.music?.failed ?? 0}
              hint={`${data.music?.completed ?? 0} completed`}
              tone="red"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="text-sm font-semibold text-white">
                Services
              </h3>

              <div className="mt-4 space-y-2">
                {services.length === 0 && (
                  <p className="text-xs text-zinc-500">
                    No scrape targets reported.
                  </p>
                )}

                {services.map((service) => (
                  <div
                    key={service.job}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-sm text-zinc-300">
                      {service.job}
                    </span>

                    <Badge tone={serviceTone(service.up)}>
                      {service.up ? 'UP' : 'DOWN'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-white">
                Health checks
              </h3>

              <div className="mt-4 space-y-2">
                {checks.length === 0 && (
                  <p className="text-xs text-zinc-500">
                    No health checks reported.
                  </p>
                )}

                {checks.map((check) => (
                  <div
                    key={check.name}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-sm text-zinc-300">
                      {check.name}
                    </span>

                    <Badge
                      tone={
                        check.status === 'UP' ? 'green' : 'red'
                      }
                    >
                      {check.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="text-sm font-semibold text-white">
                Music downloads
              </h3>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  ['Queued', data.music?.queued ?? 0],
                  ['Downloading', data.music?.downloading ?? 0],
                  ['Processing', data.music?.processing ?? 0],
                  ['Completed', data.music?.completed ?? 0],
                  ['Failed', data.music?.failed ?? 0]
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      {label}
                    </p>
                    <p className="mt-1 text-xl font-bold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-white">
                IPTV accounts
              </h3>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Active', data.iptv?.active ?? 0],
                  ['Dead', data.iptv?.dead ?? 0],
                  ['Expired', data.iptv?.expired ?? 0],
                  ['Unknown', data.iptv?.unknown ?? 0]
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      {label}
                    </p>
                    <p className="mt-1 text-xl font-bold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Badge
                  tone={
                    data.iptv?.defaultActive ? 'green' : 'amber'
                  }
                >
                  {data.iptv?.defaultActive
                    ? 'Default active'
                    : 'No active default'}
                </Badge>

                <span className="text-xs text-zinc-500">
                  {data.iptv?.total ?? 0} total
                </span>
              </div>
            </Card>
          </div>

          {(grafanaUrl || uptimeKumaUrl) && (
            <div className="flex flex-wrap gap-3">
              {grafanaUrl && (
                <a
                  href={grafanaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
                >
                  Open Grafana
                </a>
              )}

              {uptimeKumaUrl && (
                <a
                  href={uptimeKumaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
                >
                  Open Uptime Kuma
                </a>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
