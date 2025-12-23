import { Router, Request, Response } from 'express';
import { eventLogSchema, searchMemoriesSchema, memorySchema } from '../utils/validators.js';
import { insertRow, ilikeRows } from '../utils/supabaseClient.js';

export const eventsRouter = Router();

eventsRouter.post('/log', async (req: Request, res: Response) => {
  const parsed = eventLogSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const data = await insertRow('timeline', parsed.data);
    return res
      .status(201)
      .json({ event: data, next_steps: 'Generate embedding and POST /embeddings/ingest if using RAG.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

eventsRouter.post('/embeddings/ingest', async (req: Request, res: Response) => {
  const parsed = memorySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const data = await insertRow('memories', parsed.data);
    return res.status(201).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

eventsRouter.get('/memories/search', async (req: Request, res: Response) => {
  const parsed = searchMemoriesSchema.safeParse({ ...req.query, limit: Number(req.query.limit) || undefined });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { campaign_id, entity_id, entity_type, query, limit } = parsed.data;
  try {
    const filters: Record<string, any> = { campaign_id };
    if (entity_type) filters.entity_type = entity_type;
    if (entity_id) filters.entity_id = entity_id;
    const data = await ilikeRows('memories', filters, 'text', `%${query}%`, limit);
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});
