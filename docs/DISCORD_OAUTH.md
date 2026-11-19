# Discord OAuth (login)

1. <https://discord.com/developers/applications> → **New Application** ("Canela Quebrada Ranking").
2. **OAuth2 → General**: copie *Client ID* e *Client Secret*.
3. Em **Redirects** adicione a *Callback URL* do Supabase:
   `https://<project-ref>.supabase.co/auth/v1/callback`
4. No Supabase: **Authentication → Providers → Discord** → habilite e cole Client ID/Secret.
5. Escopos usados: `identify` (nome, avatar e ID). O e-mail não é solicitado.
6. Teste com `npm run dev`: o botão "Entrar com Discord" redireciona e retorna logado; o perfil é criado automaticamente.
