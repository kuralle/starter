import { loadTemplateEnv, resolveTemplateModel } from '../lib/runtime/model.js';
import { runTemplateConversation } from '../lib/runtime/smokeRunner.js';
import { buildAgents } from './agents.js';

loadTemplateEnv(import.meta.url);
const { model, label } = resolveTemplateModel();

runTemplateConversation({
  title: `restaurant-order live smoke (${label})`,
  agents: buildAgents(model),
  defaultAgentId: 'order-bot',
  model,
  prompts: [
    'Hi there',
    'Sushi please',
    '2 spicy tuna rolls',
    'What is the delivery estimate?',
    'Looks good, place it',
  ],
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
