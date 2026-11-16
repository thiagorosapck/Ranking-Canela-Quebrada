import { describe, expect, it } from 'vitest';
import { computeTrophies, sortRanking } from './trophies';
import { parseLevel, parsePlayed } from './ocr';
import { formatPlayed } from './time';
import type { LeaderboardRow } from '../types';

const row = (o: Partial<LeaderboardRow> & { user_id: string }): LeaderboardRow => ({
  discord_name: o.user_id, avatar_url: null, character_name: null, class: null, ascendancy: null, league: 'L',
  submission_id: 's-' + o.user_id, level: 50, played_seconds: 1000, voidstones: 0,
  eldritch_done: false, originator_done: false, maps_bonus_done: false, reviewed_at: null, has_pending: false, ...o,
});

describe('troféus', () => {
  const rows = [
    row({ user_id: 'a', level: 92, played_seconds: 500, eldritch_done: true, originator_done: true }),
    row({ user_id: 'b', level: 91, played_seconds: 900, eldritch_done: true, originator_done: true }),
    row({ user_id: 'c', level: 97, played_seconds: 700, eldritch_done: true, originator_done: true, maps_bonus_done: true }),
    row({ user_id: 'd', level: 40, played_seconds: 300 }),
    row({ user_id: 'e', level: 60, played_seconds: 2000 }),
    row({ user_id: 'f', level: 99, played_seconds: 10, eldritch_done: true, originator_done: false }),
  ];
  const t = computeTrophies(rows);
  it('Cabeça de Pika = maior played entre quem cumpriu o núcleo', () => expect(t.cabeca_de_pika?.user_id).toBe('b'));
  it('Pika Turbo = menor played entre quem cumpriu o núcleo', () => expect(t.pika_turbo?.user_id).toBe('a'));
  it('Pika Suprema exige lv96 + bônus de mapas', () => expect(t.pika_suprema?.user_id).toBe('c'));
  it('Pika Murcha = maior played sem nenhum marco', () => expect(t.pika_murcha?.user_id).toBe('e'));
  it('ordena por marcos, level e played', () => expect(sortRanking(rows)[0]?.user_id).toBe('c'));
});

describe('OCR parsers', () => {
  it('lê /played em inglês', () =>
    expect(parsePlayed('You have played for 2 days, 3 hours, 4 minutes, 5 seconds.')).toBe(2 * 86400 + 3 * 3600 + 4 * 60 + 5));
  it('lê /played em português', () => expect(parsePlayed('Jogou 1 hora, 30 minutos')).toBe(5400));
  it('retorna null sem tempo', () => expect(parsePlayed('nada aqui')).toBeNull());
  it('lê level', () => expect(parseLevel('Level 93 Deadeye')).toBe(93));
});

describe('formatPlayed', () => {
  it('formata', () => expect(formatPlayed(90061)).toBe('1d 01h 01m 01s'));
});
