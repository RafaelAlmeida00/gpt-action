import { Router, Request, Response } from 'express';
import { contextNpcSchema, contextPlayerSchema } from '../utils/validators.js';
import { requireAuth } from '../middleware/auth.js';
import { getSupabaseClient } from '../utils/supabaseClient.js';

export const contextRouter = Router();
contextRouter.use(requireAuth);

contextRouter.post('/npc', async (req: Request, res: Response) => {
  const parsed = contextNpcSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { campaign_id, npc_id, arc_ids } = parsed.data;
  const supabase = getSupabaseClient('service');

  const npcResult = await supabase
    .from('npcs')
    .select('*')
    .eq('id', npc_id)
    .eq('campaign_id', campaign_id)
    .eq('user_id', req.user!.id)
    .single();
  if (npcResult.error) return res.status(404).json({ error: 'npc_not_found' });

  const memories = await supabase
    .from('memories')
    .select('*')
    .eq('campaign_id', campaign_id)
    .eq('entity_type', 'npc')
    .eq('entity_id', npc_id)
    .in('visibility_scope', ['public', 'npc_only'])
    .order('happened_at', { ascending: false })
    .limit(20);

  const rels = await supabase
    .from('npc_relationships')
    .select('*')
    .eq('campaign_id', campaign_id)
    .or(`npc_id_a.eq.${npc_id},npc_id_b.eq.${npc_id}`);

  const events = await supabase
    .from('eventos_atuais')
    .select('*')
    .eq('campaign_id', campaign_id)
    .eq('user_id', req.user!.id)
    .in('arc_id', arc_ids && arc_ids.length ? arc_ids : [null]);

  return res.json({
    npc: npcResult.data,
    memories: memories.data || [],
    relationships: rels.data || [],
    events: events.data || [],
    voice: {
      speech_style: npcResult.data.speech_style,
      quirks: npcResult.data.quirks,
      goals: npcResult.data.goals,
      fears: npcResult.data.fears,
      secrets: npcResult.data.secrets,
      moral_alignment: npcResult.data.moral_alignment,
    },
  });
});

contextRouter.post('/player', async (req: Request, res: Response) => {
  const parsed = contextPlayerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { campaign_id, player_id, arc_ids } = parsed.data;
  const supabase = getSupabaseClient('service');

  const player = await supabase
    .from('jogador')
    .select('*')
    .eq('id', player_id)
    .eq('campaign_id', campaign_id)
    .eq('user_id', req.user!.id)
    .single();
  if (player.error) return res.status(404).json({ error: 'player_not_found' });

  const memories = await supabase
    .from('memories')
    .select('*')
    .eq('campaign_id', campaign_id)
    .eq('entity_type', 'player')
    .eq('entity_id', player_id)
    .in('visibility_scope', ['public', 'player_only'])
    .order('happened_at', { ascending: false })
    .limit(20);

  const arcs = await supabase
    .from('arcos')
    .select('*')
    .eq('campaign_id', campaign_id)
    .eq('user_id', req.user!.id)
    .in('id', arc_ids && arc_ids.length ? arc_ids : [null]);

  const events = await supabase
    .from('eventos_atuais')
    .select('*')
    .eq('campaign_id', campaign_id)
    .eq('user_id', req.user!.id)
    .in('arc_id', arc_ids && arc_ids.length ? arc_ids : [null]);

  return res.json({
    player: player.data,
    memories: memories.data || [],
    arcs: arcs.data || [],
    events: events.data || [],
  });
});
