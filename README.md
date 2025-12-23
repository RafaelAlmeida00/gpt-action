# Re:Zero Narrative API (Supabase + Vercel)

API serverless em Node.js/TypeScript para campanhas narrativas com Supabase (RLS) e endpoints de contexto para GPT Actions.

## Visão geral
- Supabase/Postgres com tabelas para regras, NPCs, arcos, timeline, memórias com pgvector.
- Multi-tenancy por `user_id` + `campaign_id` com RLS.
- Endpoints REST (CRUD) e rotas inteligentes de contexto/memórias.
- Deploy pronto para Vercel (`vercel.json`).

## Estrutura de pastas
- `sql/schema.sql` – schema completo + seeds Re:Zero.
- `src/` – código fonte Express.
- `api/index.ts` – entrypoint Vercel.
- `tests/` – Jest + Supertest.
- `docs/openapi.yaml` – especificação OpenAPI 3.1.

## Por que tabelas auxiliares?
- `memories`: memória episódica/canônica com pgvector para RAG e visibilidade por entidade.
- `npc_relationships`, `npc_group_memberships`: relacionamentos e afiliações para contexto semântico.
- `npc_habilidades`, `jogador_habilidades`: relação muitos-para-muitos com habilidades.

## Setup local
1. `cp .env.example .env` e preencha `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`.
2. Instale deps: `npm install`.
3. Rodar dev: `npm run dev` (http://localhost:3000/health).

## Supabase
1. `supabase db push --file sql/schema.sql` (ou via SQL Editor) para criar tudo com seeds.
2. Seeds usam `user_id = aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa` e `campaign_id = 1111...`. Ajuste conforme necessidade.
3. Policies RLS restringem todas as tabelas por `auth.uid() = user_id` (eventos canônicos têm leitura pública).
4. Funções RPC: `get_npc_visible_context(campaign_id, npc_id)` e `get_player_visible_context(campaign_id, player_id)`.

## Deploy na Vercel
1. Crie projeto Vercel e conecte este repositório.
2. Configure env vars no dashboard (mesmas do `.env`).
3. `npm run build` é executado antes do deploy; `vercel.json` roteia tudo para `api/index.ts`.
4. CORS: ajuste cabeçalhos no Vercel se integrar com GPT Actions; Express já aceita todas as origens via `cors()`.

## Endpoints principais
- CRUD: `/regras`, `/sistemas`, `/locais`, `/npcs`, `/jogador`, `/grupos`, `/habilidades`, `/eventos-canonicos`, `/timeline`, `/arcos`, `/eventos-atuais`.
- Inteligentes: `/context/npc`, `/context/player`, `/events/log`, `/events/embeddings/ingest`, `/events/memories/search`.
- Saúde: `/health`.

## Testes
- Rodar: `npm test`.
- Watch: `npm run test:watch`.
- Cobertura: `npm run test:coverage`.
- Testes usam mock do Supabase para cobrir autenticação, validação, not-found e cross-user.

## Boas práticas
- Sempre envie `Authorization: Bearer <jwt>` onde `sub` = `user_id` para alinhar com RLS.
- Inclua `campaign_id` em todos os payloads; o backend reforça `user_id` a partir do token.
- Para RAG, injete embeddings em `/events/embeddings/ingest` e ajuste a coluna `embedding` (vetor 1536).
