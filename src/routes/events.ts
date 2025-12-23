import { Router, Request, Response } from 'express';
import { eventLogSchema, searchMemoriesSchema, memorySchema } from '../utils/validators.js';
import { requireAuth } from '../middleware/auth.js';
import { getSupabaseClient } from '../utils/supabaseClient.js';

export const eventsRouter = Router();
eventsRouter.use(requireAuth);

eventsRouter.post('/log', async (req: Request, res: Response) => {
  const parsed = eventLogSchema.safeParse({ ...req.body, user_id: req.user!.id });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const supabase = getSupabaseClient('service');
  const { data, error } = await supabase.from('timeline').insert(parsed.data).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ event: data, next_steps: 'Generate embedding and POST /embeddings/ingest if using RAG.' });
});

eventsRouter.post('/embeddings/ingest', async (req: Request, res: Response) => {
  const parsed = memorySchema.safeParse({ ...req.body, user_id: req.user!.id });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const supabase = getSupabaseClient('service');
  const { data, error } = await supabase.from('memories').insert(parsed.data).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data);
});

eventsRouter.get('/memories/search', async (req: Request, res: Response) => {
  const parsed = searchMemoriesSchema.safeParse({ ...req.query, limit: Number(req.query.limit) || undefined });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { campaign_id, entity_id, entity_type, query, limit } = parsed.data;
  const supabase = getSupabaseClient('service');

  // For simplicity, use ILIKE match; in production, replace with pgvector similarity RPC.
  let builder = supabase
    .from('memories')
    .select('*')
    .eq('campaign_id', campaign_id)
    .ilike('text', `%${query}%`)
    .limit(limit);
  if (entity_type) builder = builder.eq('entity_type', entity_type);
  if (entity_id) builder = builder.eq('entity_id', entity_id);
  const { data, error } = await builder;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});
