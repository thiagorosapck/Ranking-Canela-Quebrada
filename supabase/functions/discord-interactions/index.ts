// Endpoint de Interactions do Discord (botões Aprovar / Rejeitar).
// Configure a URL no Developer Portal: https://<projeto>.supabase.co/functions/v1/discord-interactions
// Deploy com --no-verify-jwt: a autenticidade é garantida pela assinatura Ed25519 do Discord.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildEmbed, discordFetch, env, json, type SubmissionRow } from '../_shared/discord.ts';

const hex = (s: string): Uint8Array => Uint8Array.from(s.match(/.{2}/g)!.map((b) => parseInt(b, 16)));

async function verify(req: Request, body: string): Promise<boolean> {
  const sig = req.headers.get('x-signature-ed25519');
  const ts = req.headers.get('x-signature-timestamp');
  if (!sig || !ts) return false;
  try {
    const key = await crypto.subtle.importKey('raw', hex(env('DISCORD_PUBLIC_KEY')), { name: 'Ed25519' }, false, ['verify']);
    return await crypto.subtle.verify('Ed25519', key, hex(sig), new TextEncoder().encode(ts + body));
  } catch {
    return false;
  }
}

const ephemeral = (content: string) => json({ type: 4, data: { content, flags: 64 } });

interface Interaction {
  type: number;
  data?: { custom_id?: string };
  member?: { user?: { id: string } };
  user?: { id: string };
  channel_id?: string;
  message?: { embeds?: { image?: { url?: string } }[] };
}

Deno.serve(async (req) => {
  const body = await req.text();
  if (!(await verify(req, body))) return new Response('invalid request signature', { status: 401 });
  const it = JSON.parse(body) as Interaction;

  if (it.type === 1) return json({ type: 1 }); // PING

  if (it.type === 3) {
    const [action, id] = (it.data?.custom_id ?? '').split(':');
    if ((action !== 'approve' && action !== 'reject') || !id) return ephemeral('Ação desconhecida.');

    const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
    const clickerId = it.member?.user?.id ?? it.user?.id ?? '';

    // Somente administradores (perfil com role=admin vinculado ao Discord ID) podem decidir.
    const { data: admin } = await db.from('profiles').select('id, role').eq('discord_id', clickerId).maybeSingle();
    if (!admin || admin.role !== 'admin') return ephemeral('⛔ Apenas administradores podem validar evidências.');

    const { data: s } = await db.from('submissions').select('*').eq('id', id).maybeSingle<SubmissionRow>();
    if (!s) return ephemeral('Envio não encontrado.');
    if (s.status !== 'pending') return ephemeral(`Este envio já foi ${s.status === 'approved' ? 'aprovado' : 'rejeitado'}.`);

    const { data: p } = await db.from('profiles').select('discord_id, discord_name, character_name').eq('id', s.user_id).single();
    const approved = action === 'approve';

    if (approved && (s.level == null || s.played_seconds == null)) {
      return ephemeral('⚠️ Level ou /played não identificados (OCR falhou). Corrija no painel administrativo e aprove por lá.');
    }

    const { error } = await db
      .from('submissions')
      .update({
        status: approved ? 'approved' : 'rejected',
        reject_reason: approved ? null : 'Rejeitado pelo Discord. Envie novamente com uma imagem mais clara.',
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
        ocr_failed: false,
      })
      .eq('id', id);
    if (error) return ephemeral(`Erro ao atualizar: ${error.message}`);

    if (!approved && p?.discord_id) {
      // Solicita novo envio mencionando o jogador (edições de mensagem não geram ping).
      await discordFetch(`/channels/${it.channel_id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: `❌ <@${p.discord_id}>, sua evidência foi rejeitada. Por favor, **envie novamente** em ${Deno.env.get('SITE_URL') ?? 'o site do ranking'}.`,
          allowed_mentions: { users: [p.discord_id] },
        }),
      });
    }

    return json({
      type: 7, // UPDATE_MESSAGE
      data: {
        embeds: [
          buildEmbed({
            s,
            player: p?.discord_name ?? '?',
            character: p?.character_name ?? null,
            screenshotUrl: it.message?.embeds?.[0]?.image?.url ?? null,
            color: approved ? 0x2e7d32 : 0x8f1f1f,
            footer: `${approved ? '✅ Aprovado' : '❌ Rejeitado'} — Envio ${s.id}`,
          }),
        ],
        components: [],
        content: `${approved ? '✅ Aprovado' : '❌ Rejeitado'} por <@${clickerId}>`,
        allowed_mentions: { parse: [] },
      },
    });
  }

  return ephemeral('Interação não suportada.');
});
