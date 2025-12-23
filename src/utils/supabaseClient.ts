import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL as string;
const anonKey = process.env.SUPABASE_ANON_KEY as string;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey;

if (!supabaseUrl || !anonKey) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
}

const clients: Record<string, SupabaseClient> = {};

export function getSupabaseClient(role: 'anon' | 'service' = 'anon'): SupabaseClient {
  if (clients[role]) return clients[role];
  const key = role === 'service' ? serviceRole : anonKey;
  clients[role] = createClient(supabaseUrl, key, { auth: { autoRefreshToken: false } });
  return clients[role];
}
