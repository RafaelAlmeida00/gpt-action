import express from 'express';
import cors from 'cors';
import { createCrudRouter } from './routes/crudFactory.js';
import {
  regraSchema,
  sistemaSchema,
  localSchema,
  npcSchema,
  jogadorSchema,
  grupoSchema,
  habilidadeSchema,
  eventoCanonicoSchema,
  timelineSchema,
  arcoSchema,
  eventoAtualSchema,
} from './utils/validators.js';
import { errorHandler } from './utils/errorHandler.js';
import { contextRouter } from './routes/context.js';
import { eventsRouter } from './routes/events.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/regras', createCrudRouter({ table: 'regras', schema: regraSchema }));
app.use('/sistemas', createCrudRouter({ table: 'sistemas', schema: sistemaSchema }));
app.use('/locais', createCrudRouter({ table: 'locais', schema: localSchema }));
app.use('/npcs', createCrudRouter({ table: 'npcs', schema: npcSchema }));
app.use('/jogador', createCrudRouter({ table: 'jogador', schema: jogadorSchema }));
app.use('/grupos', createCrudRouter({ table: 'grupos', schema: grupoSchema }));
app.use('/habilidades', createCrudRouter({ table: 'habilidades', schema: habilidadeSchema }));
app.use('/eventos-canonicos', createCrudRouter({ table: 'eventos_canonicos', schema: eventoCanonicoSchema }));
app.use('/timeline', createCrudRouter({ table: 'timeline', schema: timelineSchema }));
app.use('/arcos', createCrudRouter({ table: 'arcos', schema: arcoSchema }));
app.use('/eventos-atuais', createCrudRouter({ table: 'eventos_atuais', schema: eventoAtualSchema }));

app.use('/context', contextRouter);
app.use('/events', eventsRouter);

app.use(errorHandler);

export default app;
