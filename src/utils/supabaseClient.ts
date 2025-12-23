import postgres, { Sql } from 'postgres';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);

type Filters = Record<string, string | number | string[] | number[]>;

function buildWhere(db: Sql, filters: Filters) {
  const clauses = Object.entries(filters).map(([key, value]) => {
    if (Array.isArray(value)) {
      return db`${db(key)} = ANY(${db.array(value)})`;
    }
    return db`${db(key)} = ${value}`;
  });
  if (!clauses.length) return db``;
  return db`WHERE ${db.join(clauses, db` AND `)}`;
}

export async function listRows<T = any>(table: string, filters: Filters = {}, options: { limit?: number } = {}) {
  const where = buildWhere(sql, filters);
  const limit = options.limit ? sql`LIMIT ${options.limit}` : sql``;
  return sql<T[]>`SELECT * FROM ${sql(table)} ${where} ${limit}`;
}

export async function getRow<T = any>(table: string, filters: Filters) {
  const rows = await listRows<T>(table, filters, { limit: 1 });
  return rows[0];
}

export async function insertRow<T = any>(table: string, payload: Record<string, any>) {
  const [row] = await sql<T[]>`INSERT INTO ${sql(table)} ${sql(payload)} RETURNING *`;
  return row;
}

export async function updateRow<T = any>(table: string, id: string, payload: Record<string, any>, filters: Filters = {}) {
  const where = buildWhere(sql, { id, ...filters });
  const [row] = await sql<T[]>`UPDATE ${sql(table)} SET ${sql(payload)} ${where} RETURNING *`;
  return row;
}

export async function deleteRow(table: string, id: string, filters: Filters = {}) {
  const where = buildWhere(sql, { id, ...filters });
  const rows = await sql`DELETE FROM ${sql(table)} ${where} RETURNING id`;
  return rows.length > 0;
}

export async function ilikeRows<T = any>(table: string, filters: Filters, column: string, pattern: string, limit = 10) {
  const where = buildWhere(sql, filters);
  return sql<T[]>`SELECT * FROM ${sql(table)} ${where} AND ${sql(column)} ILIKE ${pattern} LIMIT ${limit}`;
}

export default sql;
