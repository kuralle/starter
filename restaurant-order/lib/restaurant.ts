// A tiny in-memory restaurant backend the flow drives. Swap these functions for
// your real POS / kitchen / delivery API — the flow graph in src/flow.ts doesn't change.

export type OrderItem =
  | { type: 'pizza'; size: 'small' | 'medium' | 'large'; pizza_type: string; price: number }
  | { type: 'sushi'; count: number; roll_type: string; price: number };

export const MENU = {
  pizza: {
    sizes: { small: 10, medium: 15, large: 20 },
    types: ['pepperoni', 'cheese', 'supreme', 'vegetarian'],
  },
  sushi: {
    pricePerRoll: 8,
    rolls: ['california', 'spicy tuna', 'rainbow', 'dragon'],
  },
} as const;

/** Is the kitchen taking orders right now? Wire to real opening hours. */
export function isOpen(): boolean {
  return true;
}

let orderCounter = 1000;

export interface Receipt {
  orderId: string;
  total: number;
  etaMinutes: number;
}

/** Place an order with the kitchen and return a receipt. */
export function placeOrder(item: OrderItem): Receipt {
  orderCounter += 1;
  // (persist to your DB / fire the ticket to the kitchen here)
  return { orderId: `ORD-${orderCounter}`, total: item.price, etaMinutes: 30 };
}

/** Current delivery estimate. */
export function deliveryEstimate(): { etaMinutes: number; readyBy: string } {
  const etaMinutes = 30;
  return { etaMinutes, readyBy: new Date(Date.now() + etaMinutes * 60_000).toISOString() };
}
