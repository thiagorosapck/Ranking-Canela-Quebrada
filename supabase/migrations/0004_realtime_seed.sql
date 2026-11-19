-- Realtime para o leaderboard ao vivo
alter publication supabase_realtime add table public.submissions;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.hall_of_fame;

-- Liga inicial (renomeie / crie outras pelo painel admin)
insert into public.leagues (name, active) values ('Liga Atual', true) on conflict do nothing;

-- Para tornar alguém admin (rode no SQL Editor após o primeiro login dessa pessoa):
--   update public.profiles set role = 'admin' where discord_id = 'SEU_DISCORD_ID';
