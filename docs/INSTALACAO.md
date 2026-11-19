# Instalação

Pré-requisitos: Node.js 20+ (testado com 22), npm, uma conta GitHub, Supabase e Discord.

1. `git clone` + `npm install`.
2. Crie o projeto Supabase → [SUPABASE.md](SUPABASE.md).
3. Configure o login Discord → [DISCORD_OAUTH.md](DISCORD_OAUTH.md).
4. `cp .env.example .env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (Supabase → Project Settings → API).
5. `npm run dev`.
6. Faça login uma vez e promova-se a admin (veja [MANUTENCAO.md](MANUTENCAO.md)).
7. (Opcional) Bot → [DISCORD_BOT.md](DISCORD_BOT.md). Deploy → [DEPLOY.md](DEPLOY.md).

Scripts: `dev`, `build`, `preview`, `typecheck`, `test`, `db:push`, `functions:deploy`.
