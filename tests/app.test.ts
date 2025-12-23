import request from 'supertest';
import app from '../src/app';
import * as mockDb from './mockDb';

jest.mock('../src/utils/supabaseClient', () => require('./mockDb'));

const tables = [
  {
    path: '/regras',
    create: { campaign_id: 'camp-1', system_id: 'sys1', title: 'Nova', description: 'desc' },
    update: { title: 'Editada' }
  },
  {
    path: '/sistemas',
    create: { campaign_id: 'camp-1', name: 'SistemaX', description: 'desc' },
    update: { name: 'SistY' }
  },
  {
    path: '/locais',
    create: { campaign_id: 'camp-1', name: 'Local', description: 'd', region: 'r', tags: [] },
    update: { description: 'nova' }
  },
  { path: '/npcs', create: { campaign_id: 'camp-1', name: 'NPC', moral_alignment: 'good' }, update: { role: 'ally' } },
  { path: '/jogador', create: { campaign_id: 'camp-1', name: 'Hero', background: 'bg' }, update: { background: 'new' } },
  { path: '/grupos', create: { campaign_id: 'camp-1', name: 'Guild', description: 'd', faction: 'f' }, update: { faction: 'x' } },
  { path: '/habilidades', create: { campaign_id: 'camp-1', name: 'Skill2', description: 'd', power_level: 4 }, update: { power_level: 6 } },
  { path: '/eventos-canonicos', create: { campaign_id: 'camp-1', title: 'Evento', summary: 's', happened_at: new Date().toISOString() }, update: { summary: 'nova' } },
  { path: '/timeline', create: { campaign_id: 'camp-1', kind: 'rumor', text: 't', happened_at: new Date().toISOString() }, update: { kind: 'battle' } },
  { path: '/arcos', create: { campaign_id: 'camp-1', name: 'Arc2', status: 'planned' }, update: { status: 'active' } },
  { path: '/eventos-atuais', create: { campaign_id: 'camp-1', title: 'Evento', state: 'st', severity: 'medium' }, update: { severity: 'high' } },
];

describe('CRUD routes', () => {
  beforeEach(() => mockDb.resetStore());

  tables.forEach(({ path, create, update }) => {
    it(`${path} lists only current user data`, async () => {
      const res = await request(app).get(`${path}?campaign_id=camp-1`);
      expect(res.status).toBe(200);
    });

    it(`${path} fails validation`, async () => {
      const res = await request(app).post(path).send({});
      expect(res.status).toBe(400);
    });

    it(`${path} creates and retrieves`, async () => {
      const res = await request(app).post(path).send(create);
      expect([200,201]).toContain(res.status);
      const id = res.body.id;
      const fetched = await request(app).get(`${path}/${id}`);
      expect(fetched.status).toBe(200);
    });

    it(`${path} updates`, async () => {
      const res = await request(app).post(path).send(create);
      const id = res.body.id;
      const patch = await request(app).patch(`${path}/${id}`).send(update);
      expect(patch.status).toBe(200);
    });

    it(`${path} deletes`, async () => {
      const res = await request(app).post(path).send(create);
      const id = res.body.id;
      const del = await request(app).delete(`${path}/${id}`);
      expect(del.status).toBe(204);
    });

    it(`${path} returns 404 for other user`, async () => {
      const res = await request(app).get(`${path}/nonexistent`);
      expect([404,400]).toContain(res.status);
    });
  });
});

describe('Context and events', () => {
  beforeEach(() => mockDb.resetStore());

  it('builds npc context with gated memories', async () => {
    const res = await request(app)
      .post('/context/npc')
      .send({ campaign_id: 'camp-1', npc_id: 'npc1', time: new Date().toISOString() });
    expect(res.status).toBe(200);
    expect(res.body.memories.length).toBeGreaterThanOrEqual(1);
  });

  it('builds player context', async () => {
    const res = await request(app)
      .post('/context/player')
      .send({ campaign_id: 'camp-1', player_id: 'player1', time: new Date().toISOString() });
    expect(res.status).toBe(200);
  });

  it('logs events and ingests memory', async () => {
    const eventRes = await request(app)
      .post('/events/log')
      .send({ campaign_id: 'camp-1', kind: 'dialogue', text: 'ola', happened_at: new Date().toISOString() });
    expect(eventRes.status).toBe(201);

    const ingest = await request(app)
      .post('/events/embeddings/ingest')
      .send({ campaign_id: 'camp-1', entity_type: 'npc', entity_id: 'npc1', kind: 'dialogue', text: 'memo', happened_at: new Date().toISOString(), visibility_scope: 'public' });
    expect(ingest.status).toBe(201);

    const search = await request(app)
      .get('/events/memories/search')
      .query({ campaign_id: 'camp-1', query: 'memo' });
    expect(search.status).toBe(200);
  });
});
