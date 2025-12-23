import { Router, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { listRows, insertRow, getRow, updateRow, deleteRow } from '../utils/supabaseClient.js';

interface CrudOptions {
  table: string;
  schema: ZodSchema;
}

export function createCrudRouter({ table, schema }: CrudOptions) {
  const router = Router();

  router.get('/', async (req: Request, res: Response) => {
    const { campaign_id } = req.query as { campaign_id?: string };
    if (!campaign_id) return res.status(400).json({ error: 'campaign_id_required' });
    try {
      const data = await listRows(table, { campaign_id });
      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.post('/', async (req: Request, res: Response) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    try {
      const data = await insertRow(table, parsed.data);
      return res.status(201).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const data = await getRow(table, { id: req.params.id });
      if (!data) return res.status(404).json({ error: 'not_found' });
      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.patch('/:id', async (req: Request, res: Response) => {
    const partialSchema = schema.partial();
    const parsed = partialSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    try {
      const data = await updateRow(table, req.params.id, parsed.data);
      if (!data) return res.status(404).json({ error: 'not_found' });
      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const ok = await deleteRow(table, req.params.id);
      if (!ok) return res.status(404).json({ error: 'not_found' });
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  return router;
}
