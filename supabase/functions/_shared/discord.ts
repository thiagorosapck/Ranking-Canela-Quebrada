// Utilidades compartilhadas pelas Edge Functions do bot (Deno).
export const DISCORD_API = 'https://discord.com/api/v10';

export function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

export function formatPlayed(total: number | null): string {
  if (total == null) return '—';
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m ${s}s`;
}

export async function discordFetch(path: string, init: RequestInit): Promise<Response> {
  return await fetch(`${DISCORD_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${env('DISCORD_BOT_TOKEN')}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export interface SubmissionRow {
  id: string;
  user_id: string;
  league: string;
  played_path: string;
  proof_path: string | null;
  played_seconds: number | null;
  level: number | null;
  voidstones: number;
  eldritch_done: boolean;
  originator_done: boolean;
  maps_bonus_done: boolean;
  status: string;
  discord_message_id: string | null;
}

export function buildEmbed(opts: {
  s: SubmissionRow;
  player: string;
  character: string | null;
  screenshotUrl: string | null;
  color: number;
  footer: string;
}) {
  const { s, player, character, screenshotUrl, color, footer } = opts;
  return {
    title: '📜 Nova evidência para validação',
    color,
    fields: [
      { name: 'Jogador', value: `${character ?? '—'} (${player})`, inline: true },
      { name: 'Liga', value: s.league, inline: true },
      { name: 'Level', value: String(s.level ?? '?'), inline: true },
      { name: 'Played', value: formatPlayed(s.played_seconds), inline: true },
      { name: 'Voidstones', value: `${s.voidstones}/4`, inline: true },
      {
        name: 'Marcos declarados',
        value: [
          s.eldritch_done ? '✔ Eldritch' : '✖ Eldritch',
          s.originator_done ? '✔ Originator' : '✖ Originator',
          s.maps_bonus_done ? '✔ Bônus de mapas' : '✖ Bônus de mapas',
        ].join('\n'),
        inline: false,
      },
    ],
    ...(screenshotUrl ? { image: { url: screenshotUrl } } : {}),
    footer: { text: footer },
    timestamp: new Date().toISOString(),
  };
}
