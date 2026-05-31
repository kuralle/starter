# Restaurant Order — a Kuralle **flow** template

An order-taking agent for "Kuralle Kitchen", built with [Kuralle](https://github.com/kuralle/kuralle-agents) **flows**. It's a port of [Pipecat's food-ordering example](https://github.com/pipecat-ai/pipecat-flows) onto Kuralle's typed flow primitives — with a real order-placement backend bolted on.

The same flow runs over **text or voice** — Kuralle keeps the flow/tool authority regardless of transport.

## The flow

```
kitchen_check ─▶ initial ─▶ choose_pizza ─┐
     │              │                       ├─▶ confirm ─(complete)─▶ end
     │              └────▶ choose_sushi ───┘      │
     └─(closed)─▶ closed                          └─(revise)─▶ initial
```

- **`kitchen_check`** — an `action` node: runs code (is the kitchen open?) with no user-facing reply, then transitions.
- **`initial`** — greets, branches to pizza or sushi based on which function the model calls.
- **`choose_pizza` / `choose_sushi`** — collect size+type / count+roll, then move to confirm carrying the order in flow state.
- **`confirm`** — reads the order back; `complete_order` places it with the kitchen backend, `revise_order` loops back to `initial`.
- **`end`** — reads back the receipt (order number, total, ETA) and closes out.

Procedure lives in the **graph** (`src/flow.ts`), not a giant prompt. Each node owns one step and returns its next transition from its tool results.

## Run it

```bash
npm install
cp .env.example .env   # add your OPENAI_API_KEY
npm run smoke          # a scripted live conversation through the flow
npm run dev            # start the SSE server on http://localhost:3140
```

The server exposes `POST /api/chat/sse` — point any Kuralle chat client (or the docs widget) at it.

> **Model note:** the flow routes between branches (pizza vs sushi) via function calls, so it does best with a capable model — `gpt-4o` / `gpt-4.1`. `gpt-4o-mini` can mis-route. Set `OPENAI_MODEL` in `.env`.

## Make it yours

- **`src/flow.ts`** — the node graph. Add a node, change the branching, add a `collect` node for structured fields, attach more tools.
- **`lib/restaurant.ts`** — the backend the flow drives (`MENU`, `placeOrder`, `deliveryEstimate`, `isOpen`). Swap these for your real POS / kitchen / delivery API and the flow doesn't change.

See the [Flows guide](https://docs.kuralle.com/guides/flows) for the full node model.

## License

MIT
