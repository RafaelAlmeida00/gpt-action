type Row = Record<string, any>;

export class MockQuery {
  private filters: ((row: Row) => boolean)[] = [];
  private limitValue?: number;
  private table: string;
  constructor(private store: Record<string, Row[]>, table: string) {
    this.table = table;
  }
  private applyFilters(rows: Row[]) {
    let result = rows.filter((r) => this.filters.every((f) => f(r)));
    if (this.limitValue !== undefined) result = result.slice(0, this.limitValue);
    return result;
  }
  select() {
    const data = this.applyFilters(this.store[this.table] || []);
    return Promise.resolve({ data, error: null });
  }
  single() {
    const data = this.applyFilters(this.store[this.table] || [])[0];
    if (!data) return Promise.resolve({ data: null, error: { message: 'not_found' } });
    return Promise.resolve({ data, error: null });
  }
  eq(field: string, value: any) {
    this.filters.push((row) => row[field] === value);
    return this;
  }
  in(field: string, values: any[]) {
    this.filters.push((row) => values.includes(row[field]));
    return this;
  }
  or(expr: string) {
    const parts = expr.split(',').map((p) => p.trim());
    this.filters.push((row) => parts.some((p) => {
      const [lhs, val] = p.split('.eq.');
      const field = lhs.split('.')[1];
      return row[field] === val;
    }));
    return this;
  }
  ilike(field: string, pattern: string) {
    const search = pattern.replace(/%/g, '').toLowerCase();
    this.filters.push((row) => (row[field] || '').toLowerCase().includes(search));
    return this;
  }
  order(_field: string, _opts: { ascending: boolean }) {
    return this;
  }
  limit(n: number) {
    this.limitValue = n;
    return this;
  }
  insert(payload: Row | Row[]) {
    const rows = Array.isArray(payload) ? payload : [payload];
    const withIds = rows.map((r) => ({ id: r.id || `${this.table}-${this.store[this.table]?.length || 0}`, ...r }));
    this.store[this.table] = [...(this.store[this.table] || []), ...withIds];
    return Promise.resolve({ data: Array.isArray(payload) ? withIds : withIds[0], error: null });
  }
  update(payload: Row) {
    this.store[this.table] = (this.store[this.table] || []).map((row) => {
      if (this.filters.every((f) => f(row))) return { ...row, ...payload };
      return row;
    });
    const updated = this.applyFilters(this.store[this.table]);
    const data = updated[0];
    if (!data) return Promise.resolve({ data: null, error: { message: 'not_found' } });
    return Promise.resolve({ data, error: null });
  }
  delete() {
    const before = this.store[this.table] || [];
    const remaining = before.filter((row) => !this.filters.every((f) => f(row)));
    const deleted = before.length !== remaining.length;
    this.store[this.table] = remaining;
    if (!deleted) return Promise.resolve({ error: { message: 'not_found' } });
    return Promise.resolve({ error: null });
  }
}

export class MockSupabaseClient {
  constructor(private store: Record<string, Row[]>) {}
  from(table: string) {
    return new MockQuery(this.store, table);
  }
}

export function buildStore() {
  const baseUser = 'test-user';
  const campaign = 'camp-1';
  return {
    campanhas: [],
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
