import { Router, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { getSupabaseClient } from '../utils/supabaseClient.js';
import { requireAuth } from '../middleware/auth.js';

interface CrudOptions {
  table: string;
  schema: ZodSchema;
}

export function createCrudRouter({ table, schema }: CrudOptions) {
  const router = Router();
  router.use(requireAuth);

  router.get('/', async (req: Request, res: Response) => {
    const { campaign_id } = req.query as { campaign_id?: string };
    if (!campaign_id) return res.status(400).json({ error: 'campaign_id_required' });
    const supabase = getSupabaseClient('service');
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('campaign_id', campaign_id)
      .eq('user_id', req.user!.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  });

  router.post('/', async (req: Request, res: Response) => {
    const parsed = schema.safeParse({ ...req.body, user_id: req.user!.id });
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const supabase = getSupabaseClient('service');
    const { data, error } = await supabase.from(table).insert(parsed.data).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  });

  router.get('/:id', async (req: Request, res: Response) => {
    const supabase = getSupabaseClient('service');
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .single();
    if (error) return res.status(404).json({ error: 'not_found' });
    return res.json(data);
  });

  router.patch('/:id', async (req: Request, res: Response) => {
    const partialSchema = schema.partial();
    const parsed = partialSchema.safeParse({ ...req.body, user_id: req.user!.id });
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const supabase = getSupabaseClient('service');
    const { data, error } = await supabase
      .from(table)
      .update(parsed.data)
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .select()
      .single();
    if (error) return res.status(404).json({ error: 'not_found' });
    return res.json(data);
  });

  router.delete('/:id', async (req: Request, res: Response) => {
    const supabase = getSupabaseClient('service');
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id);
    if (error) return res.status(404).json({ error: 'not_found' });
    return res.status(204).send();
  });

  return router;
}
