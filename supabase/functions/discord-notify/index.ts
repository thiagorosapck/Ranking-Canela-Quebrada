// Publica a evidência no canal #validacao-ranking com botões Aprovar / Rejeitar.
// Chamada pelo frontend logo após o envio (JWT do jogador obrigatório).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildEmbed, discordFetch, env, json, type SubmissionRow } from '../_shared/discord.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { submission_id } = (await req.json()) as { submission_id?: string };
    if (!submission_id) return json({ error: 'submission_id obrigatório' }, 400);

    // Cliente com o JWT do usuário: a RLS garante que só o dono (ou admin) enxerga o envio.
    const asUser = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: s } = await asUser.from('submissions').select('*').eq('id', submission_id).maybeSingle<SubmissionRow>();
    if (!s) return json({ error: 'Envio não encontrado' }, 404);
    if (s.discord_message_id) return json({ ok: true, already: true });

    const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
    const { data: p } = await admin.from('profiles').select('discord_name, character_name').eq('id', s.user_id).single();
    const { data: signed } = await admin.storage.from('evidences').createSignedUrl(s.played_path, 60 * 60 * 24 * 7);

    const res = await discordFetch(`/channels/${env('DISCORD_VALIDATION_CHANNEL_ID')}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        embeds: [
          buildEmbed({
            s,
            player: p?.discord_name ?? '?',
            character: p?.character_name ?? null,
            screenshotUrl: signed?.signedUrl ?? null,
            color: 0xa8863f,
            footer: `Envio ${s.id}`,
          }),
        ],
        components: [
          {
            type: 1,
            components: [
              { type: 2, style: 3, label: 'Aprovar', emoji: { name: '✅' }, custom_id: `approve:${s.id}` },
              { type: 2, style: 4, label: 'Rejeitar', emoji: { name: '❌' }, custom_id: `reject:${s.id}` },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return json({ error: 'Falha ao publicar no Discord', detail: await res.text() }, 502);
    const msg = (await res.json()) as { id: string };
    await admin.from('submissions').update({ discord_message_id: msg.id }).eq('id', s.id);
    return json({ ok: true, message_id: msg.id });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
