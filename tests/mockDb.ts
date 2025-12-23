export type Row = Record<string, any>;

const baseUser = 'test-user';
const campaign = 'camp-1';

function defaultStore() {
  return {
    sistemas: [{ id: 'sys1', user_id: baseUser, campaign_id: campaign, name: 'sys', description: 'desc' }],
    regras: [{ id: 'rule1', user_id: baseUser, campaign_id: campaign, system_id: 'sys1', title: 'r', description: 'd' }],
    locais: [{ id: 'loc1', user_id: baseUser, campaign_id: campaign, name: 'Lugunica', description: 'capital', region: 'Lugunica', tags: [] }],
    npcs: [{ id: 'npc1', user_id: baseUser, campaign_id: campaign, name: 'Emilia', moral_alignment: 'good', local_id: 'loc1' }],
    jogador: [{ id: 'player1', user_id: baseUser, campaign_id: campaign, name: 'Player', background: 'bg' }],
    grupos: [{ id: 'group1', user_id: baseUser, campaign_id: campaign, name: 'Group', description: 'd', faction: 'f' }],
    habilidades: [{ id: 'skill1', user_id: baseUser, campaign_id: campaign, name: 'Skill', description: 'd', power_level: 5 }],
    eventos_canonicos: [{ id: 'canon1', campaign_id: campaign, title: 'Lore', summary: 's', happened_at: new Date().toISOString() }],
    timeline: [],
    arcos: [{ id: 'arc1', user_id: baseUser, campaign_id: campaign, name: 'Arc', status: 'active' }],
    eventos_atuais: [{ id: 'now1', user_id: baseUser, campaign_id: campaign, title: 'Now', state: 'ongoing', severity: 'low', arc_id: 'arc1' }],
    npc_relationships: [{ id: 'rel1', campaign_id: campaign, user_id: baseUser, npc_id_a: 'npc1', npc_id_b: 'npc1', relation_type: 'ally', intensity: 1, notes: '' }],
    memories: [{ id: 'mem1', campaign_id: campaign, user_id: baseUser, entity_type: 'npc', entity_id: 'npc1', kind: 'dialogue', text: 'hi', happened_at: new Date().toISOString(), visibility_scope: 'public' }],
  } as Record<string, Row[]>;
}

const store = defaultStore();

function applyFilters(rows: Row[], filters: Record<string, any>) {
  return rows.filter((row) => Object.entries(filters).every(([key, value]) => {
    if (Array.isArray(value)) return value.includes(row[key]);
    return row[key] === value;
  }));
}

export async function listRows(table: string, filters: Record<string, any> = {}, options: { limit?: number } = {}) {
  const rows = applyFilters(store[table] || [], filters);
  const limited = options.limit ? rows.slice(0, options.limit) : rows;
  return limited;
}

export async function getRow(table: string, filters: Record<string, any>) {
  const rows = await listRows(table, filters, { limit: 1 });
  return rows[0];
}

export async function insertRow(table: string, payload: Row) {
  const row = { id: payload.id || `${table}-${(store[table] || []).length + 1}`, ...payload };
  store[table] = [...(store[table] || []), row];
  return row;
}

export async function updateRow(table: string, id: string, payload: Row) {
  const rows = store[table] || [];
  let updated: Row | undefined;
  store[table] = rows.map((row) => {
    if (row.id === id) {
      updated = { ...row, ...payload };
      return updated;
    }
    return row;
  });
  return updated;
}

export async function deleteRow(table: string, id: string) {
  const before = store[table] || [];
  const remaining = before.filter((row) => row.id !== id);
  store[table] = remaining;
  return before.length !== remaining.length;
}

export async function ilikeRows(table: string, filters: Record<string, any>, column: string, pattern: string, limit = 10) {
  const rows = await listRows(table, filters);
  const search = pattern.replace(/%/g, '').toLowerCase();
  return rows.filter((row) => String(row[column] || '').toLowerCase().includes(search)).slice(0, limit);
}

export function resetStore() {
  const fresh = defaultStore();
  Object.keys(fresh).forEach((key) => {
    store[key] = fresh[key];
  });
}
