import { z } from 'zod';

const id = z.string().uuid({ message: 'invalid_uuid' });
const optionalStr = z.string().max(1000).optional();
const nullableStr = z.string().max(2000).nullable().optional();

export const campaignScoped = z.object({
  campaign_id: id,
});

export const regraSchema = campaignScoped.extend({
  user_id: id,
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(2000),
  system_id: id,
});

export const sistemaSchema = campaignScoped.extend({
  user_id: id,
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(2000),
});

export const localSchema = campaignScoped.extend({
  user_id: id,
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(2000),
  region: z.string().min(1).max(255),
  tags: z.array(z.string()).default([]),
});

export const npcSchema = campaignScoped.extend({
  user_id: id,
  name: z.string().min(1).max(255),
  role: optionalStr,
  speech_style: optionalStr,
  quirks: optionalStr,
  goals: optionalStr,
  fears: optionalStr,
  secrets: optionalStr,
  moral_alignment: optionalStr,
  local_id: id.optional(),
});

export const jogadorSchema = campaignScoped.extend({
  user_id: id,
  name: z.string().min(1).max(255),
  background: optionalStr,
});

export const grupoSchema = campaignScoped.extend({
  user_id: id,
  name: z.string().min(1).max(255),
  description: optionalStr,
  faction: optionalStr,
});

export const habilidadeSchema = campaignScoped.extend({
  user_id: id,
  name: z.string().min(1).max(255),
  description: optionalStr,
  power_level: z.number().int().min(1).max(10),
});

export const eventoCanonicoSchema = campaignScoped.extend({
  user_id: id.optional(),
  title: z.string().min(1).max(255),
  summary: z.string().min(1).max(2000),
  happened_at: z.string().datetime(),
});

export const timelineSchema = campaignScoped.extend({
  user_id: id,
  kind: z.enum(['rumor', 'battle', 'political', 'personal', 'mystery']),
  text: z.string().min(1).max(2000),
  happened_at: z.string().datetime(),
});

export const arcoSchema = campaignScoped.extend({
  user_id: id,
  name: z.string().min(1).max(255),
  status: z.enum(['planned', 'active', 'resolved', 'failed']),
  hooks: optionalStr,
  clues: optionalStr,
  stakes: optionalStr,
});

export const eventoAtualSchema = campaignScoped.extend({
  user_id: id,
  title: z.string().min(1).max(255),
  state: z.string().min(1).max(2000),
  severity: z.enum(['low', 'medium', 'high']),
  arc_id: id.optional(),
});

export const memorySchema = campaignScoped.extend({
  user_id: id,
  entity_type: z.enum(['npc', 'player', 'world']),
  entity_id: id,
  kind: z.enum(['dialogue', 'event', 'rumor', 'clue']),
  text: z.string().min(1).max(2000),
  happened_at: z.string().datetime(),
  visibility_scope: z.enum(['public', 'npc_only', 'player_only', 'gm_only']).default('public'),
  summary_short: optionalStr,
  summary_long: optionalStr,
  embedding: z.array(z.number()).optional(),
});

export const contextNpcSchema = z.object({
  campaign_id: id,
  npc_id: id,
  local_id: id.optional(),
  time: z.string().datetime(),
  arc_ids: z.array(id).optional(),
  player_state_hint: optionalStr,
});

export const contextPlayerSchema = z.object({
  campaign_id: id,
  player_id: id,
  local_id: id.optional(),
  time: z.string().datetime(),
  arc_ids: z.array(id).optional(),
});

export const eventLogSchema = z.object({
  campaign_id: id,
  user_id: id,
  kind: z.enum(['dialogue', 'rumor', 'battle', 'investigation', 'downtime']),
  text: z.string().min(1).max(2000),
  happened_at: z.string().datetime(),
  participants: z.array(id).optional(),
  visibility_scope: z.enum(['public', 'npc_only', 'player_only', 'gm_only']).default('public'),
});

export const searchMemoriesSchema = z.object({
  campaign_id: id,
  query: z.string().min(1),
  entity_type: z.enum(['npc', 'player', 'world']).optional(),
  entity_id: id.optional(),
  limit: z.number().int().min(1).max(50).default(10),
});
