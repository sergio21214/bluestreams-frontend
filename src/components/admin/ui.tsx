'use client';

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes
} from 'react';

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function Card({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-white/5 bg-white/[0.03] p-5',
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'blue'
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: 'blue' | 'green' | 'red' | 'amber' | 'slate';
}) {
  const tones: Record<string, string> = {
    blue: 'from-blue-500/20 to-blue-900/5 text-blue-300',
    green: 'from-emerald-500/20 to-emerald-900/5 text-emerald-300',
    red: 'from-red-500/20 to-red-900/5 text-red-300',
    amber: 'from-amber-500/20 to-amber-900/5 text-amber-300',
    slate: 'from-slate-500/20 to-slate-900/5 text-slate-300'
  };

  return (
    <div
      className={cx(
        'rounded-2xl border border-white/5 bg-gradient-to-br p-5',
        tones[tone]
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      {hint && <p className="mt-1 text-xs opacity-70">{hint}</p>}
    </div>
  );
}

export function Badge({
  children,
  tone = 'slate'
}: {
  children: ReactNode;
  tone?: 'blue' | 'green' | 'red' | 'amber' | 'slate';
}) {
  const tones: Record<string, string> = {
    blue: 'border-blue-500/20 bg-blue-500/15 text-blue-300',
    green: 'border-emerald-500/20 bg-emerald-500/15 text-emerald-300',
    red: 'border-red-500/20 bg-red-500/15 text-red-300',
    amber: 'border-amber-500/20 bg-amber-500/15 text-amber-300',
    slate: 'border-white/10 bg-white/5 text-zinc-300'
  };

  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}) {
  const variants: Record<string, string> = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-500 disabled:bg-blue-600/40',
    secondary:
      'border border-white/10 bg-white/5 text-white hover:bg-white/10',
    danger:
      'border border-red-500/20 bg-red-500/15 text-red-200 hover:bg-red-500/25',
    ghost: 'text-zinc-300 hover:bg-white/10 hover:text-white'
  };

  return (
    <button
      type="button"
      {...props}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  hint
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px] text-zinc-500">
          {hint}
        </span>
      )}
    </label>
  );
}

export function TextInput(
  props: InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className={cx(
        'w-full rounded-xl border border-white/10 bg-[#0a1322] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-blue-500/60',
        props.className
      )}
    />
  );
}

export function Select({
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cx(
        'w-full rounded-xl border border-white/10 bg-[#0a1322] px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500/60',
        props.className
      )}
    >
      {children}
    </select>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-zinc-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-500" />
      {label}
    </span>
  );
}

export function EmptyState({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-6 py-12 text-center">
      <p className="text-sm font-semibold text-zinc-300">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      )}
    </div>
  );
}

export function Alert({
  tone = 'info',
  children
}: {
  tone?: 'info' | 'success' | 'error';
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    info: 'border-blue-500/20 bg-blue-500/10 text-blue-200',
    success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
    error: 'border-red-500/20 bg-red-500/10 text-red-200'
  };

  return (
    <div
      className={cx(
        'rounded-xl border px-4 py-3 text-sm',
        tones[tone]
      )}
    >
      {children}
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#081020] p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-5 w-5"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {children}

        {footer && (
          <div className="mt-6 flex justify-end gap-2">{footer}</div>
        )}
      </div>
    </div>
  );
}
