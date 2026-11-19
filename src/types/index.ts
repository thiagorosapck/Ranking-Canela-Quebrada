export type Role = 'user' | 'admin';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type TrophyKind = 'cabeca_de_pika' | 'pika_turbo' | 'pika_suprema' | 'pika_murcha';

export interface Profile {
  id: string;
  discord_id: string;
  discord_name: string;
  avatar_url: string | null;
  character_name: string | null;
  class: string | null;
  ascendancy: string | null;
  league: string | null;
  role: Role;
  created_at: string;
}

export interface League {
  name: string;
  active: boolean;
  closed_at: string | null;
  created_at: string;
}

export interface Submission {
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
  ocr_text: string | null;
  ocr_confidence: number | null;
  ocr_failed: boolean;
  status: SubmissionStatus;
  reject_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export type SubmissionWithProfile = Submission & {
  profiles: Pick<Profile, 'discord_name' | 'avatar_url' | 'character_name' | 'class'> | null;
};

/** Linha da view `leaderboard`. */
export interface LeaderboardRow {
  user_id: string;
  discord_name: string;
  avatar_url: string | null;
  character_name: string | null;
  class: string | null;
  ascendancy: string | null;
  league: string | null;
  submission_id: string | null;
  level: number | null;
  played_seconds: number | null;
  voidstones: number | null;
  eldritch_done: boolean;
  originator_done: boolean;
  maps_bonus_done: boolean;
  reviewed_at: string | null;
  has_pending: boolean;
}

export interface HallEntry {
  id: string;
  league: string;
  user_id: string | null;
  player_name: string;
  avatar_url: string | null;
  trophy: TrophyKind;
  played_seconds: number | null;
  awarded_at: string;
}
