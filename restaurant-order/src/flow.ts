import { action, buildToolSet, defineFlow, defineTool, reply } from '@kuralle-agents/core';
import type { LanguageModel } from 'ai';
import { z } from 'zod';
import { MENU, deliveryEstimate, isOpen, placeOrder, type OrderItem, type Receipt } from '../lib/restaurant.js';

const ROLE =
  'You are the order-taking assistant for Kuralle Kitchen. Always use the available functions to move the order forward — never just describe what you would do. Keep replies short, warm, and casual.';

/**
 * The order flow as a typed node graph:
 *
 *   kitchen_check ─▶ initial ─▶ choose_pizza ─┐
 *        │              │                       ├─▶ confirm ─(complete)─▶ place ─▶ end
 *        │              └────▶ choose_sushi ───┘      │
 *        └─(closed)─▶ closed                          └─(revise)─▶ initial
 *
 * Each `reply` node shows the model only the functions relevant to its step (via
 * `tools`) and returns its next transition from the tool results. The selected item
 * rides in flow state (`goto.data` → `Object.assign(state, …)`); the `place` action
 * reads it and places the order, and `end` reads the receipt back via state-aware
 * instructions.
 */
export function buildOrderFlow(model: LanguageModel) {
  // ---- tools (defined once, exposed per-node via buildToolSet) ----
  const getDeliveryEstimate = defineTool({
    name: 'get_delivery_estimate',
    description: 'Tell the customer how long delivery will take.',
    input: z.object({}),
    execute: async () => deliveryEstimate(),
  });
  const chooseCategory = defineTool({
    name: 'choose_category',
    description: 'Record whether the customer wants pizza or sushi. Call exactly once, with their choice.',
    input: z.object({ category: z.enum(['pizza', 'sushi']) }),
    execute: async ({ category }) => ({ category }),
  });
  const selectPizza = defineTool({
    name: 'select_pizza',
    description: 'Record the pizza size and type.',
    input: z.object({
      size: z.enum(['small', 'medium', 'large']),
      pizza_type: z.enum(['pepperoni', 'cheese', 'supreme', 'vegetarian']),
    }),
    execute: async ({ size, pizza_type }) => {
      const price = MENU.pizza.sizes[size];
      const order: OrderItem = { type: 'pizza', size, pizza_type, price };
      return { order };
    },
  });
  const selectSushi = defineTool({
    name: 'select_sushi',
    description: 'Record the sushi count and roll type.',
    input: z.object({
      count: z.number().int().min(1).max(12),
      roll_type: z.enum(['california', 'spicy tuna', 'rainbow', 'dragon']),
    }),
    execute: async ({ count, roll_type }) => {
      const price = count * MENU.sushi.pricePerRoll;
      const order: OrderItem = { type: 'sushi', count, roll_type, price };
      return { order };
    },
  });
  const completeOrder = defineTool({
    name: 'complete_order',
    description: 'The customer confirms the order is correct.',
    input: z.object({}),
    execute: async () => ({ confirmed: true }),
  });
  const reviseOrder = defineTool({
    name: 'revise_order',
    description: 'The customer wants to change their order.',
    input: z.object({}),
    execute: async () => ({ revise: true }),
  });

  // ---- nodes ----
  const end = reply({
    id: 'end',
    model,
    instructions: ({ state }) => {
      const r = state.receipt as Receipt | undefined;
      return r
        ? `The order is placed. In one short sentence, tell the customer their order number is ${r.orderId}, the total is $${r.total}, and delivery is about ${r.etaMinutes} minutes — then thank them and end.`
        : 'Thank the customer for their order and end politely, in one short sentence.';
    },
    next: () => ({ end: 'order_completed' }),
  });

  // An `action` node runs code with no user-facing reply, then transitions.
  // It reads the collected order straight from flow state and places it.
  const place = action({
    id: 'place_order',
    run: (state) => {
      const order = state.order as OrderItem | undefined;
      if (!order) return initial;
      const receipt = placeOrder(order);
      return { goto: end, data: { receipt } };
    },
  });

  const closed = reply({
    id: 'closed',
    model,
    instructions: 'Politely tell the customer the kitchen is closed right now and to come back during opening hours. Keep it to one sentence.',
    next: () => ({ end: 'closed' }),
  });

  const confirm = reply({
    id: 'confirm',
    model,
    instructions: `Read back the full order — the item and its price — and ask the customer to confirm or change it. Use the functions:
- complete_order when they confirm it is correct
- revise_order if they want to change something`,
    tools: () => buildToolSet({ get_delivery_estimate: getDeliveryEstimate, complete_order: completeOrder, revise_order: reviseOrder }),
    next: (turn) => {
      if (turn.toolResults.some((r) => r.name === 'complete_order')) return place;
      if (turn.toolResults.some((r) => r.name === 'revise_order')) return initial;
      return 'stay';
    },
  });

  const choosePizzaNode = reply({
    id: 'choose_pizza',
    model,
    instructions: `Take a pizza order. Sizes: small $${MENU.pizza.sizes.small}, medium $${MENU.pizza.sizes.medium}, large $${MENU.pizza.sizes.large}. Types: ${MENU.pizza.types.join(', ')}. Call select_pizza once you have BOTH a size and a type.`,
    tools: () => buildToolSet({ get_delivery_estimate: getDeliveryEstimate, select_pizza: selectPizza }),
    next: (turn) => {
      const r = turn.toolResults.find((t) => t.name === 'select_pizza');
      if (r?.result) return { goto: confirm, data: r.result as Record<string, unknown> };
      return 'stay';
    },
  });

  const chooseSushiNode = reply({
    id: 'choose_sushi',
    model,
    instructions: `Take a sushi order. $${MENU.sushi.pricePerRoll} per roll. Rolls: ${MENU.sushi.rolls.join(', ')}. Call select_sushi once you have BOTH a count and a roll type.`,
    tools: () => buildToolSet({ get_delivery_estimate: getDeliveryEstimate, select_sushi: selectSushi }),
    next: (turn) => {
      const r = turn.toolResults.find((t) => t.name === 'select_sushi');
      if (r?.result) return { goto: confirm, data: r.result as Record<string, unknown> };
      return 'stay';
    },
  });

  const initial = reply({
    id: 'initial',
    model,
    instructions: `${ROLE}\n\nGreet the customer, then ask whether they would like pizza or sushi. When they say which, call choose_category once with their choice.`,
    tools: () => buildToolSet({ get_delivery_estimate: getDeliveryEstimate, choose_category: chooseCategory }),
    next: (turn) => {
      const r = turn.toolResults.find((t) => t.name === 'choose_category');
      const category = (r?.result as { category?: string } | undefined)?.category;
      if (category === 'pizza') return choosePizzaNode;
      if (category === 'sushi') return chooseSushiNode;
      return 'stay';
    },
  });

  const kitchenCheck = action({
    id: 'kitchen_check',
    run: () => (isOpen() ? initial : closed),
  });

  return defineFlow({
    name: 'order',
    description: 'Greet, take a pizza or sushi order, confirm it, and place it with the kitchen.',
    start: kitchenCheck,
    nodes: [kitchenCheck, initial, choosePizzaNode, chooseSushiNode, confirm, place, closed, end],
  });
}
