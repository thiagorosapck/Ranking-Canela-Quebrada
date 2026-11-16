# Bot Discord (validação)

O bot é **serverless** (Supabase Edge Functions) — não precisa de servidor 24 h.

## 1. Criar o bot
1. Na mesma aplicação Discord → **Bot** → *Reset Token* e copie o token (`DISCORD_BOT_TOKEN`).
2. **General Information**: copie a *Public Key* (`DISCORD_PUBLIC_KEY`).
3. **OAuth2 → URL Generator**: escopo `bot`; permissões *View Channel*, *Send Messages*, *Embed Links*. Abra a URL e adicione o bot ao servidor.
4. Crie o canal `#validacao-ranking`, ative o Modo Desenvolvedor (Configurações → Avançado) e copie o ID do canal (`DISCORD_VALIDATION_CHANNEL_ID`). Restrinja o canal aos admins.

## 2. Publicar as functions
```bash
npx supabase login
npx supabase link --project-ref <project-ref>
cat > supabase/.env <<ENV
DISCORD_BOT_TOKEN=...
DISCORD_PUBLIC_KEY=...
DISCORD_VALIDATION_CHANNEL_ID=...
SITE_URL=https://SEU-USUARIO.github.io/NOME-DO-REPO/
ENV
npx supabase secrets set --env-file supabase/.env
npm run functions:deploy
```
(`SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` já são injetadas pelo Supabase.)

## 3. Interactions Endpoint
Developer Portal → **General Information → Interactions Endpoint URL**:
`https://<project-ref>.supabase.co/functions/v1/discord-interactions`
O Discord envia um PING; a function responde após validar a assinatura Ed25519.

## 4. Fluxo
- Jogador envia evidência → o site chama `discord-notify` → embed com Jogador, Level, Played, Screenshot e botões ✅/❌.
- **Aprovar**: atualiza `submissions` no Supabase (`approved`) e o ranking muda em tempo real. Se o OCR falhou (sem level/tempo), o bot pede para corrigir no painel.
- **Rejeitar**: marca `rejected`, menciona o jogador pedindo **novo envio**; o motivo aparece no perfil dele.
- Só quem tem `role = admin` **e** Discord ID cadastrado pode usar os botões.
