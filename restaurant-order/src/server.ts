import { serve } from '@hono/node-server';
import { createRuntime } from '@kuralle-agents/core';
import { createKuralleSseChatRouter } from '@kuralle-agents/hono-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { mergeHarnessTools } from '../lib/runtime/harnessTools.js';
import { loadTemplateEnv, resolveTemplateModel } from '../lib/runtime/model.js';
import { buildAgents } from './agents.js';

loadTemplateEnv(import.meta.url);

const { model } = resolveTemplateModel();
const agents = buildAgents(model);

const runtime = createRuntime({
  agents,
  defaultAgentId: 'order-bot',
  defaultModel: model,
  tools: mergeHarnessTools(agents),
});

const app = new Hono();
app.use('/*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'OPTIONS'] }));

app.get('/', (c) =>
  c.json({
    name: 'restaurant-order',
    status: 'ready',
    endpoints: ['POST /api/chat/sse'],
    agents: agents.map((a) => a.id),
  }),
);

app.route('/', createKuralleSseChatRouter({ runtime, streamFilter: 'all' }));

const port = Number(process.env.PORT ?? 3140);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[restaurant-order] listening on http://localhost:${info.port}`);
});
