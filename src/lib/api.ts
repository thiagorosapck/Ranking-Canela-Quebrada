import { supabase, EVIDENCE_BUCKET } from './supabase';
import type {
  HallEntry, LeaderboardRow, League, Profile, Submission, SubmissionWithProfile, TrophyKind,
} from '../types';

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

// Perfil ----------------------------------------------------------------------
export async function getProfile(id: string): Promise<Profile | null> {
  return check(await supabase.from('profiles').select('*').eq('id', id).maybeSingle<Profile>());
}

export async function updateProfile(
  id: string,
  patch: Pick<Profile, 'character_name' | 'class' | 'ascendancy' | 'league'>,
): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function listProfiles(): Promise<Profile[]> {
  return check(await supabase.from('profiles').select('*').order('created_at', { ascending: false }).returns<Profile[]>());
}

// Ligas -----------------------------------------------------------------------
export async function listLeagues(): Promise<League[]> {
  return check(await supabase.from('leagues').select('*').order('created_at', { ascending: false }).returns<League[]>());
}

export async function createLeague(name: string): Promise<void> {
  const { error } = await supabase.from('leagues').insert({ name });
  if (error) throw new Error(error.message);
}

export async function setActiveLeague(name: string): Promise<void> {
  const off = await supabase.from('leagues').update({ active: false }).eq('active', true);
  if (off.error) throw new Error(off.error.message);
  const on = await supabase.from('leagues').update({ active: true, closed_at: null }).eq('name', name);
  if (on.error) throw new Error(on.error.message);
}

// Ranking / dashboard -----------------------------------------------------------
export async function getLeaderboard(league: string): Promise<LeaderboardRow[]> {
  return check(await supabase.from('leaderboard').select('*').eq('league', league).returns<LeaderboardRow[]>());
}

export async function getRecentSubmissions(league: string, limit = 8): Promise<SubmissionWithProfile[]> {
  return check(
    await supabase
      .from('submissions')
      .select('*, profiles!submissions_user_id_fkey(discord_name, avatar_url, character_name, class)')
      .eq('league', league)
      .order('created_at', { ascending: false })
      .limit(limit)
      .returns<SubmissionWithProfile[]>(),
  );
}

/** Assina mudanças em tempo real; retorna função para cancelar. */
export function subscribeRanking(onChange: () => void): () => void {
  const ch = supabase
    .channel('ranking-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'hall_of_fame' }, onChange)
    .subscribe();
  return () => {
    void supabase.removeChannel(ch);
  };
}

// Submissões ----------------------------------------------------------------------
export async function listMySubmissions(userId: string): Promise<Submission[]> {
  return check(
    await supabase.from('submissions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).returns<Submission[]>(),
  );
}

export async function listAdminSubmissions(status: Submission['status'] | 'all'): Promise<SubmissionWithProfile[]> {
  let q = supabase
    .from('submissions')
    .select('*, profiles!submissions_user_id_fkey(discord_name, avatar_url, character_name, class)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (status !== 'all') q = q.eq('status', status);
  return check(await q.returns<SubmissionWithProfile[]>());
}

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function validateImage(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Formato inválido. Use PNG, JPG ou WEBP.';
  if (file.size > MAX_UPLOAD_BYTES) return 'Arquivo acima de 20 MB.';
  return null;
}

export async function uploadEvidence(userId: string, file: File): Promise<string> {
  const err = validateImage(file);
  if (err) throw new Error(err);
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(EVIDENCE_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function signedUrl(path: string, seconds = 3600): Promise<string | null> {
  const { data } = await supabase.storage.from(EVIDENCE_BUCKET).createSignedUrl(path, seconds);
  return data?.signedUrl ?? null;
}

export type NewSubmission = Pick<
  Submission,
  | 'user_id' | 'league' | 'played_path' | 'proof_path' | 'played_seconds' | 'level' | 'voidstones'
  | 'eldritch_done' | 'originator_done' | 'maps_bonus_done' | 'ocr_text' | 'ocr_confidence' | 'ocr_failed'
>;

export async function createSubmission(input: NewSubmission): Promise<Submission> {
  const created = check(await supabase.from('submissions').insert(input).select('*').single<Submission>());
  // Aciona o bot do Discord. Falha aqui não invalida o envio (admin ainda valida pelo painel).
  void supabase.functions.invoke('discord-notify', { body: { submission_id: created.id } }).catch(() => undefined);
  return created;
}

export type ReviewPatch = Partial<
  Pick<Submission, 'level' | 'played_seconds' | 'voidstones' | 'eldritch_done' | 'originator_done' | 'maps_bonus_done'>
>;

export async function reviewSubmission(
  id: string,
  adminId: string,
  decision: 'approved' | 'rejected',
  patch: ReviewPatch,
  rejectReason?: string,
): Promise<void> {
  const { error } = await supabase
    .from('submissions')
    .update({
      ...patch,
      status: decision,
      reject_reason: decision === 'rejected' ? rejectReason || 'Envie novamente com uma imagem mais clara.' : null,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      ocr_failed: false,
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

// Hall da Fama --------------------------------------------------------------------
export async function listHall(): Promise<HallEntry[]> {
  return check(await supabase.from('hall_of_fame').select('*').order('awarded_at', { ascending: false }).returns<HallEntry[]>());
}

export async function registerWinners(
  league: string,
  winners: { kind: TrophyKind; row: LeaderboardRow }[],
): Promise<void> {
  const rows = winners.map(({ kind, row }) => ({
    league,
    user_id: row.user_id,
    player_name: row.character_name || row.discord_name,
    avatar_url: row.avatar_url,
    trophy: kind,
    played_seconds: row.played_seconds,
  }));
  const { error } = await supabase.from('hall_of_fame').upsert(rows, { onConflict: 'league,trophy' });
  if (error) throw new Error(error.message);
  const closed = await supabase.from('leagues').update({ closed_at: new Date().toISOString(), active: false }).eq('name', league);
  if (closed.error) throw new Error(closed.error.message);
}
