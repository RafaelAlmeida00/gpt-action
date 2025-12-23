-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- Types
do $$ begin
  if not exists (select 1 from pg_type where typname = 'arc_status') then
    create type arc_status as enum ('planned','active','resolved','failed');
  end if;
  if not exists (select 1 from pg_type where typname = 'severity_level') then
    create type severity_level as enum ('low','medium','high');
  end if;
  if not exists (select 1 from pg_type where typname = 'memory_kind') then
    create type memory_kind as enum ('dialogue','event','rumor','clue');
  end if;
  if not exists (select 1 from pg_type where typname = 'visibility_scope') then
    create type visibility_scope as enum ('public','npc_only','player_only','gm_only');
  end if;
  if not exists (select 1 from pg_type where typname = 'entity_kind') then
    create type entity_kind as enum ('npc','player','world');
  end if;
end $$;

-- Helper updated_at trigger
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Core tables
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger campaigns_set_updated_at before update on campaigns for each row execute procedure set_updated_at();

create table if not exists sistemas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  name text not null,
  description text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger sistemas_set_updated_at before update on sistemas for each row execute procedure set_updated_at();

create table if not exists regras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  system_id uuid not null references sistemas(id) on delete cascade,
  title text not null,
  description text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger regras_set_updated_at before update on regras for each row execute procedure set_updated_at();

create table if not exists locais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  name text not null,
  description text not null,
  region text not null,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger locais_set_updated_at before update on locais for each row execute procedure set_updated_at();

create table if not exists npcs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  name text not null,
  role text,
  speech_style text,
  quirks text,
  goals text,
  fears text,
  secrets text,
  moral_alignment text,
  local_id uuid references locais(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger npcs_set_updated_at before update on npcs for each row execute procedure set_updated_at();

create table if not exists jogador (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  name text not null,
  background text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger jogador_set_updated_at before update on jogador for each row execute procedure set_updated_at();

create table if not exists grupos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  name text not null,
  description text,
  faction text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger grupos_set_updated_at before update on grupos for each row execute procedure set_updated_at();

create table if not exists habilidades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  name text not null,
  description text,
  power_level int not null check (power_level between 1 and 10),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger habilidades_set_updated_at before update on habilidades for each row execute procedure set_updated_at();

create table if not exists eventos_canonicos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  title text not null,
  summary text not null,
  happened_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger eventos_canonicos_set_updated_at before update on eventos_canonicos for each row execute procedure set_updated_at();

create table if not exists timeline (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  kind text not null,
  text text not null,
  happened_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger timeline_set_updated_at before update on timeline for each row execute procedure set_updated_at();

create table if not exists arcos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  name text not null,
  status arc_status not null default 'planned',
  hooks text,
  clues text,
  stakes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger arcos_set_updated_at before update on arcos for each row execute procedure set_updated_at();

create table if not exists eventos_atuais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  title text not null,
  state text not null,
  severity severity_level not null,
  arc_id uuid references arcos(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger eventos_atuais_set_updated_at before update on eventos_atuais for each row execute procedure set_updated_at();

-- Auxiliary tables
create table if not exists npc_relationships (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  user_id uuid not null,
  npc_id_a uuid not null references npcs(id) on delete cascade,
  npc_id_b uuid not null references npcs(id) on delete cascade,
  relation_type text not null,
  intensity int default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint no_self_relation check (npc_id_a <> npc_id_b)
);
create trigger npc_relationships_set_updated_at before update on npc_relationships for each row execute procedure set_updated_at();

create table if not exists npc_group_memberships (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  user_id uuid not null,
  npc_id uuid not null references npcs(id) on delete cascade,
  group_id uuid not null references grupos(id) on delete cascade,
  role text,
  status text,
  since timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger npc_group_memberships_set_updated_at before update on npc_group_memberships for each row execute procedure set_updated_at();

create table if not exists npc_habilidades (
  npc_id uuid references npcs(id) on delete cascade,
  habilidade_id uuid references habilidades(id) on delete cascade,
  primary key (npc_id, habilidade_id)
);

create table if not exists jogador_habilidades (
  jogador_id uuid references jogador(id) on delete cascade,
  habilidade_id uuid references habilidades(id) on delete cascade,
  primary key (jogador_id, habilidade_id)
);

create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  user_id uuid not null,
  entity_type entity_kind not null,
  entity_id uuid not null,
  kind memory_kind not null,
  text text not null,
  happened_at timestamptz not null,
  visibility_scope visibility_scope not null default 'public',
  summary_short text,
  summary_long text,
  embedding vector(1536),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists memories_entity_idx on memories (campaign_id, entity_type, entity_id, happened_at desc);
create trigger memories_set_updated_at before update on memories for each row execute procedure set_updated_at();

-- Functions for knowledge gating
create or replace function public.get_npc_visible_context(p_campaign uuid, p_npc uuid)
returns json as $$
  declare
    npc_record json;
    rels json;
    mems json;
    events json;
  begin
    select row_to_json(n) into npc_record from npcs n where n.id = p_npc and n.campaign_id = p_campaign;
    select json_agg(r) into rels from npc_relationships r where r.campaign_id = p_campaign and (r.npc_id_a = p_npc or r.npc_id_b = p_npc);
    select json_agg(m) into mems from memories m where m.campaign_id = p_campaign and m.entity_type = 'npc' and m.entity_id = p_npc and m.visibility_scope in ('public','npc_only') order by m.happened_at desc limit 20;
    select json_agg(e) into events from eventos_atuais e where e.campaign_id = p_campaign and (e.arc_id is null or e.arc_id in (select id from arcos where campaign_id = p_campaign));
    return json_build_object('npc', npc_record, 'relationships', coalesce(rels,'[]'::json), 'memories', coalesce(mems,'[]'::json), 'events', coalesce(events,'[]'::json));
  end;
$$ language plpgsql security definer;

drop function if exists public.get_player_visible_context(uuid, uuid);
create or replace function public.get_player_visible_context(p_campaign uuid, p_player uuid)
returns json as $$
  declare
    player_record json;
    mems json;
    arcs json;
    events json;
  begin
    select row_to_json(j) into player_record from jogador j where j.id = p_player and j.campaign_id = p_campaign;
    select json_agg(m) into mems from memories m where m.campaign_id = p_campaign and m.entity_type = 'player' and m.entity_id = p_player and m.visibility_scope in ('public','player_only') order by m.happened_at desc limit 20;
    select json_agg(a) into arcs from arcos a where a.campaign_id = p_campaign;
    select json_agg(e) into events from eventos_atuais e where e.campaign_id = p_campaign;
    return json_build_object('player', player_record, 'memories', coalesce(mems,'[]'::json), 'arcs', coalesce(arcs,'[]'::json), 'events', coalesce(events,'[]'::json));
  end;
$$ language plpgsql security definer;

-- RLS policies
alter table campaigns enable row level security;
alter table sistemas enable row level security;
alter table regras enable row level security;
alter table locais enable row level security;
alter table npcs enable row level security;
alter table jogador enable row level security;
alter table grupos enable row level security;
alter table habilidades enable row level security;
alter table eventos_canonicos enable row level security;
alter table timeline enable row level security;
alter table arcos enable row level security;
alter table eventos_atuais enable row level security;
alter table npc_relationships enable row level security;
alter table npc_group_memberships enable row level security;
alter table memories enable row level security;

create policy user_owns_campaign on campaigns
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy own_data_select on sistemas for select using (auth.uid() = user_id);
create policy own_data_mod on sistemas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy own_regras_select on regras for select using (auth.uid() = user_id);
create policy own_regras_mod on regras for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy own_locais_select on locais for select using (auth.uid() = user_id);
create policy own_locais_mod on locais for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy own_npcs_select on npcs for select using (auth.uid() = user_id);
create policy own_npcs_mod on npcs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy own_jogador_select on jogador for select using (auth.uid() = user_id);
create policy own_jogador_mod on jogador for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy own_grupos_select on grupos for select using (auth.uid() = user_id);
create policy own_grupos_mod on grupos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy own_habilidades_select on habilidades for select using (auth.uid() = user_id);
create policy own_habilidades_mod on habilidades for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy eventos_canonicos_public_read on eventos_canonicos for select using (true);
create policy eventos_canonicos_owner_mod on eventos_canonicos for all using (auth.uid() = user_id or user_id is null) with check (auth.uid() = user_id or user_id is null);

create policy own_timeline_select on timeline for select using (auth.uid() = user_id);
create policy own_timeline_mod on timeline for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy own_arcos_select on arcos for select using (auth.uid() = user_id);
create policy own_arcos_mod on arcos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy own_eventos_atuais_select on eventos_atuais for select using (auth.uid() = user_id);
create policy own_eventos_atuais_mod on eventos_atuais for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy own_npc_relationships on npc_relationships for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy own_npc_group_memberships on npc_group_memberships for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy own_memories on memories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Seed data (Re:Zero minimal)
insert into campaigns (id, user_id, name) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Campanha Re:Zero')
on conflict do nothing;

insert into sistemas (id, user_id, campaign_id, name, description) values
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Re:Zero Tactics', 'Sistema leve para política e mistério em Lugunica')
on conflict do nothing;

insert into regras (user_id, campaign_id, system_id, title, description) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Pontos de Trauma', 'Cada cena intensa adiciona 1 trauma; 3 traumas forçam repouso')
  on conflict do nothing;

insert into locais (id, user_id, campaign_id, name, description, region, tags) values
  ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Capital de Lugunica', 'Centro político do reino', 'Lugunica', '{capital,politica}'),
  ('33333333-3333-3333-3333-333333333334', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Mansão Roswaal', 'Residência isolada no campo', 'Elior', '{mansao,magia}'),
  ('33333333-3333-3333-3333-333333333335', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Santuário', 'Vilarejo escondido em floresta mística', 'Elior', '{barreira,secreto}')
on conflict do nothing;

insert into npcs (id, user_id, campaign_id, name, role, speech_style, quirks, goals, fears, secrets, moral_alignment, local_id) values
  ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Emilia', 'Candidata ao trono', 'Suave e empática', 'Brinca com cabelo ao pensar', 'Proteger aliados', 'Ser rejeitada pelo reino', 'Origem meio-elfa ligada à Bruxa da Inveja', 'leal', '33333333-3333-3333-3333-333333333333'),
  ('44444444-4444-4444-4444-444444444445', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Subaru Natsuki', 'Protagonista relutante', 'Informal, referências modernas', 'Autodepreciação', 'Salvar Emilia e amigos', 'Falhar novamente', 'Retorno pela Morte', 'caotico_bom', '33333333-3333-3333-3333-333333333334'),
  ('44444444-4444-4444-4444-444444444446', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Roswaal L. Mathers', 'Nobre excêntrico', 'Entonação teatral', 'Planos longos prazos', 'Ajudar sua visão do futuro', 'Perder controle do plano', 'Pacto secreto com Echidna', 'neutro', '33333333-3333-3333-3333-333333333334')
on conflict do nothing;

insert into jogador (id, user_id, campaign_id, name, background) values
  ('55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Jogador Convidado', 'Aventureiro trazido a Lugunica')
on conflict do nothing;

insert into grupos (id, user_id, campaign_id, name, description, faction) values
  ('66666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Candidatura Emilia', 'Equipe que apoia Emilia', 'Coroação de Lugunica')
on conflict do nothing;

insert into npc_group_memberships (campaign_id, user_id, npc_id, group_id, role, status) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', 'Líder moral', 'ativo'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444445', '66666666-6666-6666-6666-666666666666', 'Apoiador errante', 'ativo')
on conflict do nothing;

insert into habilidades (id, user_id, campaign_id, name, description, power_level) values
  ('77777777-7777-7777-7777-777777777777', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Magia de Gelo', 'Domínio de gelo de Emilia', 7),
  ('77777777-7777-7777-7777-777777777778', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Bênção da Bruxa', 'Capacidade de retornar pela morte', 10),
  ('77777777-7777-7777-7777-777777777779', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Magia Teatral', 'Manipulação arcana e política', 8)
on conflict do nothing;

insert into npc_habilidades values
  ('44444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777777'),
  ('44444444-4444-4444-4444-444444444445', '77777777-7777-7777-7777-777777777778'),
  ('44444444-4444-4444-4444-444444444446', '77777777-7777-7777-7777-777777777779')
on conflict do nothing;

insert into jogador_habilidades values
  ('55555555-5555-5555-5555-555555555555', '77777777-7777-7777-7777-777777777777')
on conflict do nothing;

insert into eventos_canonicos (id, campaign_id, title, summary, happened_at) values
  ('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'Queda da Bruxa da Inveja', 'Evento histórico que marcou o medo a meio-elfos', '400 years ago'),
  ('88888888-8888-8888-8888-888888888889', '11111111-1111-1111-1111-111111111111', 'Candidatura Real', 'Seleção das candidatas ao trono de Lugunica', now() - interval '1 year'),
  ('88888888-8888-8888-8888-888888888890', '11111111-1111-1111-1111-111111111111', 'Ataques do Culto das Bruxas', 'Incidentes coordenados pelo culto em Lugunica', now() - interval '6 months')
on conflict do nothing;

insert into arcos (id, user_id, campaign_id, name, status, hooks, clues, stakes) values
  ('99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Conspiração do Culto', 'active', 'Rumores de infiltração em Lugunica', 'Cultistas vistos perto do Santuário', 'Evitar colapso do reino')
on conflict do nothing;

insert into eventos_atuais (id, user_id, campaign_id, title, state, severity, arc_id) values
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Investigação no Santuário', 'Barreira instável após ataque do culto', 'high', '99999999-9999-9999-9999-999999999999')
on conflict do nothing;

insert into timeline (id, user_id, campaign_id, kind, text, happened_at) values
  ('bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'rumor', 'Aldeões cochicham sobre um arcebispo próximo', now() - interval '3 days')
on conflict do nothing;

insert into memories (id, campaign_id, user_id, entity_type, entity_id, kind, text, happened_at, visibility_scope, summary_short) values
  ('ccccccc1-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'npc', '44444444-4444-4444-4444-444444444444', 'dialogue', 'Emilia ouviu rumores sobre o Culto das Bruxas nas aldeias próximas.', now() - interval '2 days', 'npc_only', 'Emilia suspeita do culto'),
  ('ccccccc1-cccc-cccc-cccc-cccccccccccd', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'player', '55555555-5555-5555-5555-555555555555', 'clue', 'Jogador descobriu um símbolo do culto no Santuário.', now() - interval '1 day', 'player_only', 'Símbolo do culto encontrado')
on conflict do nothing;

comment on function get_npc_visible_context is 'Retorna somente informações visíveis ao NPC (memórias npc_only/public).';
comment on function get_player_visible_context is 'Retorna informações que o jogador descobriu, sem vazar segredos de NPCs.';
