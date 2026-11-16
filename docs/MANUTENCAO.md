# Manutenção do ranking

## Promover administrador
Após a pessoa logar uma vez, no SQL Editor do Supabase:
```sql
update public.profiles set role = 'admin' where discord_id = 'ID_DISCORD_DA_PESSOA';
```
Para rebaixar, use `role = 'user'`.

## Nova liga
Painel Admin → **Ligas** → criar → **Ativar**. Jogadores escolhem a liga em *Perfil*.
Novos usuários entram automaticamente na liga ativa.

## Validar evidências
Painel Admin → **Validação**: confira as imagens, corrija level, tempo, voidstones e marcos (Eldritch/Originator/bônus de mapas) e clique em Aprovar ou Rejeitar (informe o motivo). Envios com selo "OCR falhou" precisam de conferência manual. Também é possível aprovar pelos botões do Discord.

## Encerrar liga
Painel Admin → Ligas → **Encerrar + Hall da Fama**: calcula os 4 troféus com os envios aprovados e grava em `hall_of_fame`; a liga deixa de ser ativa. Registrar de novo atualiza os vencedores da mesma liga.

## Regras de cálculo
Veja `src/lib/trophies.ts` (com testes em `trophies.test.ts`). Ordenação do ranking: mais marcos > maior level > menor `/played`.

## Rotina
- Revisar pendentes regularmente (`status = pending`).
- Storage free tier = 1 GB: apague imagens de ligas antigas se necessário.
- Rotacione o token do bot se vazar (`supabase secrets set DISCORD_BOT_TOKEN=...`).
