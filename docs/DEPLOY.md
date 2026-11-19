# Deploy no GitHub Pages

1. Suba o código para o GitHub (branch `main`).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. **Settings → Secrets and variables → Actions** → crie:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - (para o workflow Supabase) `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_ID`
4. Cada push na `main` executa `.github/workflows/deploy.yml`: `npm ci` → testes → `npm run build` → publica `dist/`.
5. URL final: `https://<usuario>.github.io/<repo>/`. Adicione-a em *Site URL* / *Redirect URLs* do Supabase Auth e em `SITE_URL` do bot.

O app usa `HashRouter` e `base` relativo, então não há problemas de 404 em rotas no Pages.
