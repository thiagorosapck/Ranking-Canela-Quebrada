/** Converte segundos em "3d 04h 12m 05s" (omitindo dias quando 0). */
export function formatPlayed(total: number | null | undefined): string {
  if (total == null) return '—';
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d > 0 ? `${d}d ` : ''}${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}

export function splitSeconds(total: number | null): { d: number; h: number; m: number; s: number } {
  const t = total ?? 0;
  return { d: Math.floor(t / 86400), h: Math.floor((t % 86400) / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 };
}

export function joinSeconds(p: { d: number; h: number; m: number; s: number }): number {
  return Math.max(0, p.d) * 86400 + Math.max(0, p.h) * 3600 + Math.max(0, p.m) * 60 + Math.max(0, p.s);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
