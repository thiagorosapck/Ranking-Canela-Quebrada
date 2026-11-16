# Configuração do Supabase

1. Crie um projeto em <https://supabase.com> (plano Free).
2. **Estrutura SQL** — escolha uma opção:
   - **SQL Editor**: cole e execute, em ordem, `supabase/migrations/0001…0004`.
   - **CLI**: `npx supabase login` → `./scripts/migrate.sh <project-ref>` (ou `npm run db:push` após `supabase link`).
   - **GitHub Actions**: workflow *Supabase (migrations + functions)* (secrets em [DEPLOY.md](DEPLOY.md)).
3. O que as migrações criam:
   - Tabelas `leagues`, `profiles`, `submissions`, `hall_of_fame` e a view `leaderboard`.
   - Trigger que cria o perfil no primeiro login Discord.
   - RLS em todas as tabelas; funções `is_admin()`, anti-abuso (máx. 5 envios pendentes) e proteção dos campos `role`/`discord_id`.
   - Bucket privado `evidences` (20 MB; PNG/JPG/WEBP) com políticas por pasta `<user-id>/`.
   - Realtime nas tabelas do ranking e a liga inicial "Liga Atual".
4. **Authentication → URL Configuration**: `Site URL` = URL do GitHub Pages; em *Redirect URLs* inclua também `http://localhost:5173`.
5. Copie *Project URL* e *anon key* para `.env`. **Nunca** exponha a `service_role` no frontend.

## Modelo de segurança

| Recurso | Jogador | Admin |
| --- | --- | --- |
| Ranking/perfis/ligas/hall | leitura (logado) | leitura + escrita |
| Submissões | cria as próprias (sempre `pending`); lê as próprias e as aprovadas | lê/edita todas |
| Storage | grava/lê apenas em `<seu-id>/` | lê tudo |
| `profiles.role` | não altera | altera |
