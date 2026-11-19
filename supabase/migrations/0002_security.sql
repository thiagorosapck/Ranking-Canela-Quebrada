-- Funções, triggers e Row Level Security ----------------------------------------

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Cria o perfil automaticamente no primeiro login com Discord.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  did  text  := coalesce(meta->>'provider_id', meta->>'sub', new.id::text);
  dname text := coalesce(meta->'custom_claims'->>'global_name', meta->>'full_name', meta->>'name', 'Jogador');
begin
  insert into public.profiles (id, discord_id, discord_name, avatar_url, league)
  values (new.id, did, dname, meta->>'avatar_url', (select name from public.leagues where active limit 1))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Usuários comuns não podem alterar papel nem identidade Discord.
create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role <> old.role or new.discord_id <> old.discord_id or new.id <> old.id then
      raise exception 'Campo protegido';
    end if;
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- Anti-abuso: no máximo 5 envios pendentes por jogador.
create or replace function public.limit_pending_submissions() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.submissions where user_id = new.user_id and status = 'pending') >= 5 then
    raise exception 'Limite de 5 envios pendentes atingido. Aguarde a validação.';
  end if;
  return new;
end $$;
create trigger submissions_limit before insert on public.submissions
  for each row execute function public.limit_pending_submissions();

-- RLS -------------------------------------------------------------------------
alter table public.leagues      enable row level security;
alter table public.profiles     enable row level security;
alter table public.submissions  enable row level security;
alter table public.hall_of_fame enable row level security;

-- leagues
create policy leagues_read  on public.leagues for select to authenticated using (true);
create policy leagues_admin on public.leagues for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- profiles
create policy profiles_read   on public.profiles for select to authenticated using (true);
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- submissions
create policy submissions_read on public.submissions for select to authenticated
  using (status = 'approved' or user_id = auth.uid() or public.is_admin());
create policy submissions_insert on public.submissions for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and reviewed_by is null and reviewed_at is null
    and played_path like auth.uid()::text || '/%'
    and (proof_path is null or proof_path like auth.uid()::text || '/%')
  );
create policy submissions_admin_update on public.submissions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy submissions_delete on public.submissions for delete to authenticated
  using (public.is_admin() or (user_id = auth.uid() and status <> 'approved'));

-- hall_of_fame
create policy hof_read  on public.hall_of_fame for select to authenticated using (true);
create policy hof_admin on public.hall_of_fame for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Ranking: somente logados
revoke all on public.leaderboard from anon;
grant select on public.leaderboard to authenticated;
revoke all on all tables in schema public from anon;
