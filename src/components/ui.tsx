import type { ReactNode } from 'react';
import { TROPHIES } from '../lib/trophies';
import type { TrophyKind } from '../types';

export function Panel({ title, children, className = '', right }: { title?: string; children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <section className={`panel p-4 sm:p-6 ${className}`}>
      {(title || right) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-lg sm:text-xl">{title}</h2>}
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl sm:text-3xl font-black">{title}</h1>
      {subtitle && <p className="mt-1 text-parch/70">{subtitle}</p>}
      <div className="divider mt-3" />
    </div>
  );
}

export function Spinner({ label = 'Carregando…' }: { label?: string }) {
  return <p className="py-10 text-center font-ui text-sm text-gold-500 animate-pulse">{label}</p>;
}

export function ErrorBox({ message }: { message: string }) {
  return <p role="alert" className="rounded border border-blood-400/60 bg-blood-700/30 px-3 py-2 font-ui text-sm text-red-200">{message}</p>;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="panel p-4">
      <p className="font-ui text-[11px] uppercase tracking-wider text-gold-500">{label}</p>
      <p className="mt-1 font-display text-2xl text-gold-200">{value}</p>
      {hint && <p className="font-ui text-xs text-parch/60">{hint}</p>}
    </div>
  );
}

export function Medal({ position }: { position: number }) {
  if (position === 1) return <span title="Ouro">🥇</span>;
  if (position === 2) return <span title="Prata">🥈</span>;
  if (position === 3) return <span title="Bronze">🥉</span>;
  return <span className="text-parch/60">{position}</span>;
}

export function Avatar({ src, name, size = 32 }: { src: string | null; name: string; size?: number }) {
  return src ? (
    <img src={src} alt={name} width={size} height={size} className="rounded-full border border-gold-600 object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="inline-flex items-center justify-center rounded-full border border-gold-600 bg-blood-700 font-display text-gold-200" style={{ width: size, height: size }}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function TrophyBadge({ kind }: { kind: TrophyKind }) {
  const t = TROPHIES[kind];
  const tone = kind === 'pika_murcha' ? 'border-blood-400 text-red-300 bg-blood-700/30' : 'border-gold-500 text-gold-200 bg-gold-700/20';
  return <span className={`badge ${tone}`} title={t.rule}>{t.icon} {t.label}</span>;
}

export function StatusBadge({ tone, children }: { tone: 'gold' | 'green' | 'red' | 'gray'; children: ReactNode }) {
  const map = {
    gold: 'border-gold-400 text-gold-200 bg-gold-600/25',
    green: 'border-emerald-600 text-emerald-300 bg-emerald-900/30',
    red: 'border-blood-400 text-red-300 bg-blood-700/30',
    gray: 'border-parch/30 text-parch/80 bg-void-700',
  } as const;
  return <span className={`badge ${map[tone]}`}>{children}</span>;
}
