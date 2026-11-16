import type { LeaderboardRow, TrophyKind } from '../types';

export const TROPHIES: Record<TrophyKind, { label: string; icon: string; rule: string }> = {
  cabeca_de_pika: {
    label: 'Cabeça de Pika',
    icon: '🐌',
    rule: 'Maior /played entre quem concluiu Eldritch, Originator e chegou ao nível 90.',
  },
  pika_turbo: {
    label: 'Pika Turbo',
    icon: '⚡',
    rule: 'Menor /played entre quem concluiu Eldritch, Originator e chegou ao nível 90.',
  },
  pika_suprema: {
    label: 'Pika Suprema',
    icon: '👑',
    rule: 'Menor /played com Eldritch, Originator, nível 96 e todos os bônus de mapas concluídos.',
  },
  pika_murcha: {
    label: 'Pika Murcha',
    icon: '🥀',
    rule: 'Maior /played sem ter atingido Eldritch, Originator nem nível 90.',
  },
};

const hasPlayed = (r: LeaderboardRow): r is LeaderboardRow & { played_seconds: number } =>
  r.submission_id !== null && r.played_seconds !== null;

export const reachedCore = (r: LeaderboardRow): boolean =>
  r.eldritch_done && r.originator_done && (r.level ?? 0) >= 90;

export const reachedSuprema = (r: LeaderboardRow): boolean =>
  r.eldritch_done && r.originator_done && (r.level ?? 0) >= 96 && r.maps_bonus_done;

/** Nenhum dos três marcos (Eldritch, Originator, Lv 90) foi atingido. */
export const reachedNothing = (r: LeaderboardRow): boolean =>
  !r.eldritch_done && !r.originator_done && (r.level ?? 0) < 90;

function pick(rows: LeaderboardRow[], dir: 'max' | 'min'): LeaderboardRow | null {
  let best: (LeaderboardRow & { played_seconds: number }) | null = null;
  for (const r of rows) {
    if (!hasPlayed(r)) continue;
    if (!best || (dir === 'max' ? r.played_seconds > best.played_seconds : r.played_seconds < best.played_seconds)) best = r;
  }
  return best;
}

/** Calcula quem detém cada troféu neste momento. Todos os critérios usam apenas envios aprovados. */
export function computeTrophies(rows: LeaderboardRow[]): Partial<Record<TrophyKind, LeaderboardRow>> {
  const out: Partial<Record<TrophyKind, LeaderboardRow>> = {};
  const core = rows.filter(reachedCore);
  const cabeca = pick(core, 'max');
  const turbo = pick(core, 'min');
  const suprema = pick(rows.filter(reachedSuprema), 'min');
  const murcha = pick(rows.filter(reachedNothing), 'max');
  if (cabeca) out.cabeca_de_pika = cabeca;
  if (turbo) out.pika_turbo = turbo;
  if (suprema) out.pika_suprema = suprema;
  if (murcha) out.pika_murcha = murcha;
  return out;
}

/** user_id -> troféus que o jogador detém. */
export function trophiesByUser(rows: LeaderboardRow[]): Map<string, TrophyKind[]> {
  const map = new Map<string, TrophyKind[]>();
  for (const [kind, row] of Object.entries(computeTrophies(rows)) as [TrophyKind, LeaderboardRow][]) {
    map.set(row.user_id, [...(map.get(row.user_id) ?? []), kind]);
  }
  return map;
}

/** Pontuação de progresso (marcos atingidos) usada na ordenação do ranking. */
export function milestones(r: LeaderboardRow): number {
  return (
    Number(r.eldritch_done) +
    Number(r.originator_done) +
    Number((r.level ?? 0) >= 90) +
    Number((r.level ?? 0) >= 96) +
    Number(r.maps_bonus_done)
  );
}

/** Ordena: mais marcos > maior level > menor played. Sem envio aprovado vai ao fim. */
export function sortRanking(rows: LeaderboardRow[]): LeaderboardRow[] {
  return [...rows].sort((a, b) => {
    const ah = hasPlayed(a) ? 1 : 0;
    const bh = hasPlayed(b) ? 1 : 0;
    if (ah !== bh) return bh - ah;
    return (
      milestones(b) - milestones(a) ||
      (b.level ?? 0) - (a.level ?? 0) ||
      (a.played_seconds ?? Infinity) - (b.played_seconds ?? Infinity)
    );
  });
}

export function statusLabel(r: LeaderboardRow): { text: string; tone: 'gold' | 'green' | 'red' | 'gray' } {
  if (!r.submission_id) return { text: r.has_pending ? 'Em validação' : 'Sem envio', tone: r.has_pending ? 'gray' : 'red' };
  if (reachedSuprema(r)) return { text: 'Suprema', tone: 'gold' };
  if (reachedCore(r)) return { text: 'Completo', tone: 'green' };
  return { text: 'Em progresso', tone: 'gray' };
}
