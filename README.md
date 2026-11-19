# ⚔️ Canela Quebrada Ranking

**Ranking Oficial da Liga** — gerenciamento de torneios internos de **Path of Exile** para o clã Canela Quebrada.
Hospedagem 100 % gratuita: GitHub Pages + Supabase (free tier) + Discord.

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 18 · TypeScript (strict) · TailwindCSS · Vite |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions) |
| Login | Discord OAuth (exclusivo) |
| OCR | Tesseract.js (no navegador) |
| Bot | Edge Functions `discord-notify` + `discord-interactions` |
| Deploy | GitHub Actions → GitHub Pages |

## Início rápido

```bash
git clone https://github.com/thiagorosapck/Ranking-Canela-Quebrada.git
cd Ranking-Canela-Quebrada
npm install
cp .env.example .env      # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev               # http://localhost:5173
```

Build de produção: `npm run build` (saída em `dist/`). Testes: `npm test`.

## Funcionalidades

- Login somente via Discord; perfil criado automaticamente (nome, avatar, Discord ID).
- Perfil: personagem, classe, ascendancy, liga, data de inscrição.
- Envio de evidências (PNG/JPG/WEBP, até 20 MB) para o Supabase Storage, com OCR de `/played` e level.
- Comprovação de Eldritch / Originator / bônus de mapas com screenshot.
- Troféus automáticos: **Cabeça de Pika**, **Pika Turbo**, **Pika Suprema**, **Pika Murcha** (`src/lib/trophies.ts`).
- Ranking em tempo real (🥇🥈🥉), Dashboard e Hall da Fama.
- Painel admin: aprovar/rejeitar, corrigir OCR/level/tempo/progresso, gerenciar ligas e encerrar liga (grava no Hall da Fama).
- Bot Discord: publica em `#validacao-ranking` com botões ✅ Aprovar / ❌ Rejeitar.
- Segurança: RLS em todas as tabelas, login obrigatório, papéis admin/user, bucket privado com política por pasta, limite de envios pendentes.

## Estrutura

```
.github/workflows/   deploy.yml (Pages) · supabase.yml (migrações + functions)
docs/                documentação detalhada + mockups/index.html
scripts/migrate.sh   aplica migrações
supabase/
  config.toml
  migrations/        0001 schema · 0002 RLS/funções · 0003 storage · 0004 realtime/seed
  functions/         discord-notify · discord-interactions · _shared
src/
  components/ context/ lib/ pages/ types/
```

## Documentação

1. [Instalação](docs/INSTALACAO.md)
2. [Supabase](docs/SUPABASE.md)
3. [Discord OAuth](docs/DISCORD_OAUTH.md)
4. [Discord Bot](docs/DISCORD_BOT.md)
5. [Deploy no GitHub Pages](docs/DEPLOY.md)
6. [Manutenção do ranking](docs/MANUTENCAO.md)
7. [Mockups](docs/mockups/index.html) (abra no navegador)

## Regras dos troféus

| Troféu | Critério |
| --- | --- |
| Cabeça de Pika | Maior `/played` entre quem concluiu Eldritch + Originator + nível 90 |
| Pika Turbo | Menor `/played` entre quem concluiu Eldritch + Originator + nível 90 |
| Pika Suprema | Menor `/played` com Eldritch + Originator + nível 96 + todos os bônus de mapas |
| Pika Murcha | Maior `/played` entre quem **não** atingiu Eldritch, Originator nem nível 90 |

Somente evidências **aprovadas** entram nos cálculos.

## Futuras integrações

`src/lib/poe.ts` define a interface `PoeProvider`. Se a API oficial do Path of Exile for liberada para esse uso, basta implementar o provider e alimentar as submissões automaticamente.
