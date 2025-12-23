import { Router, Request, Response } from 'express';
import { contextNpcSchema, contextPlayerSchema } from '../utils/validators.js';
import { getRow, listRows } from '../utils/supabaseClient.js';

export const contextRouter = Router();

contextRouter.post('/npc', async (req: Request, res: Response) => {
  const parsed = contextNpcSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { campaign_id, npc_id, arc_ids } = parsed.data;
  try {
    const npc = await getRow('npcs', { id: npc_id, campaign_id });
    if (!npc) return res.status(404).json({ error: 'npc_not_found' });

    const memories = await listRows(
      'memories',
      { campaign_id, entity_type: 'npc', entity_id: npc_id },
      { limit: 20 }
    );
    const visibleMemories = memories
      .filter((m) => ['public', 'npc_only'].includes(m.visibility_scope))
      .sort((a, b) => new Date(b.happened_at).getTime() - new Date(a.happened_at).getTime());

    const relationships = await listRows('npc_relationships', { campaign_id });
    const rels = relationships.filter((r) => r.npc_id_a === npc_id || r.npc_id_b === npc_id);

    const events = await listRows('eventos_atuais', { campaign_id }, { limit: 50 });
    const filteredEvents = arc_ids?.length
      ? events.filter((e) => arc_ids.includes(e.arc_id))
      : events.filter((e) => !e.arc_id);

    return res.json({
      npc,
      memories: visibleMemories,
      relationships: rels,
      events: filteredEvents,
      voice: {
        speech_style: npc.speech_style,
        quirks: npc.quirks,
        goals: npc.goals,
        fears: npc.fears,
        secrets: npc.secrets,
        moral_alignment: npc.moral_alignment,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

contextRouter.post('/player', async (req: Request, res: Response) => {
  const parsed = contextPlayerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { campaign_id, player_id, arc_ids } = parsed.data;
  try {
    const player = await getRow('jogador', { id: player_id, campaign_id });
    if (!player) return res.status(404).json({ error: 'player_not_found' });

    const memories = await listRows(
      'memories',
      { campaign_id, entity_type: 'player', entity_id: player_id },
      { limit: 20 }
    );
    const visibleMemories = memories
      .filter((m) => ['public', 'player_only'].includes(m.visibility_scope))
      .sort((a, b) => new Date(b.happened_at).getTime() - new Date(a.happened_at).getTime());

    const arcs = await listRows('arcos', { campaign_id });
    const filteredArcs = arc_ids?.length ? arcs.filter((a) => arc_ids.includes(a.id)) : [];

    const events = await listRows('eventos_atuais', { campaign_id });
    const filteredEvents = arc_ids?.length
      ? events.filter((e) => arc_ids.includes(e.arc_id))
      : events.filter((e) => !e.arc_id);

    return res.json({
      player,
      memories: visibleMemories,
      arcs: filteredArcs,
      events: filteredEvents,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});
