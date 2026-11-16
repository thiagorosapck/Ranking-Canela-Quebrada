-- Canela Quebrada Ranking — estrutura principal (Path of Exile)
create extension if not exists pgcrypto;

create type public.user_role as enum ('user', 'admin');
create type public.submission_status as enum ('pending', 'approved', 'rejected');
create type public.trophy_kind as enum ('cabeca_de_pika', 'pika_turbo', 'pika_suprema', 'pika_murcha');

-- Ligas ---------------------------------------------------------------------
create table public.leagues (
  name        text primary key check (char_length(name) between 2 and 60),
  active      boolean not null default false,
  closed_at   timestamptz,
  created_at  timestamptz not null default now()
);
-- no máximo uma liga ativa
create unique index leagues_single_active on public.leagues (active) where active;

-- Perfis --------------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  discord_id     text not null unique,
  discord_name   text not null,
  avatar_url     text,
  character_name text check (character_name is null or char_length(character_name) between 2 and 40),
  class          text check (class is null or char_length(class) <= 30),
  ascendancy     text check (ascendancy is null or char_length(ascendancy) <= 30),
  league         text references public.leagues (name) on update cascade on delete set null,
  role           public.user_role not null default 'user',
  created_at     timestamptz not null default now()
);

-- Submissões (evidências) -----------------------------------------------------
create table public.submissions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  league           text not null references public.leagues (name) on update cascade,
  played_path      text not null,          -- screenshot do /played + level (Storage)
  proof_path       text,                   -- screenshot das voidstones / conclusão
  played_seconds   integer check (played_seconds is null or played_seconds >= 0),
  level            smallint check (level is null or level between 1 and 100),
  voidstones       smallint not null default 0 check (voidstones between 0 and 4),
  eldritch_done    boolean not null default false,
  originator_done  boolean not null default false,
  maps_bonus_done  boolean not null default false,
  ocr_text         text,
  ocr_confidence   real,
  ocr_failed       boolean not null default false,
  status           public.submission_status not null default 'pending',
  reject_reason    text,
  reviewed_by      uuid references public.profiles (id) on delete set null,
  reviewed_at      timestamptz,
  discord_message_id text,
  created_at       timestamptz not null default now()
);
create index submissions_user_idx   on public.submissions (user_id, created_at desc);
create index submissions_status_idx on public.submissions (status, created_at desc);
create index submissions_league_idx on public.submissions (league);

-- Hall da Fama ----------------------------------------------------------------
create table public.hall_of_fame (
  id             uuid primary key default gen_random_uuid(),
  league         text not null,
  user_id        uuid references public.profiles (id) on delete set null,
  player_name    text not null,
  avatar_url     text,
  trophy         public.trophy_kind not null,
  played_seconds integer,
  awarded_at     timestamptz not null default now(),
  unique (league, trophy)
);

-- Ranking (último envio aprovado de cada jogador na sua liga) ------------------
create or replace view public.leaderboard as
select
  p.id as user_id, p.discord_name, p.avatar_url, p.character_name, p.class, p.ascendancy, p.league,
  s.id as submission_id, s.level, s.played_seconds, s.voidstones,
  coalesce(s.eldritch_done, false)   as eldritch_done,
  coalesce(s.originator_done, false) as originator_done,
  coalesce(s.maps_bonus_done, false) as maps_bonus_done,
  s.reviewed_at,
  exists (select 1 from public.submissions x where x.user_id = p.id and x.status = 'pending') as has_pending
from public.profiles p
left join lateral (
  select * from public.submissions s
  where s.user_id = p.id and s.league = p.league and s.status = 'approved'
  order by s.created_at desc limit 1
) s on true
where p.league is not null;
