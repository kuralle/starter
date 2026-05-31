import { defineAgent, type AgentConfig } from '@kuralle-agents/core';
import type { LanguageModel } from 'ai';
import { buildOrderFlow } from './flow.js';

/** The order bot: a single flow agent. Its behavior lives in the flow (src/flow.ts),
 *  not in a long prompt — that's the point of Kuralle flows. */
export function buildAgents(model: LanguageModel): AgentConfig[] {
  const orderBot = defineAgent({
    id: 'order-bot',
    name: 'Kuralle Kitchen',
    model,
    instructions: 'You take food orders for Kuralle Kitchen by following the order flow.',
    flows: [buildOrderFlow(model)],
  });

  return [orderBot];
}
