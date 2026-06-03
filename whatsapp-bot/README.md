# whatsapp-bot

A deployable WhatsApp bot built with [Kuralle](https://github.com/kuralle/kuralle-agents) — bring your own WhatsApp Cloud API number and token (no Embedded Signup). One runtime, one support flow, with **window-safe outbound** via `@kuralle-agents/engagement` policies (a closed-window free-form message can't leak — it converts to a template or defers).

```
WhatsApp user ──>  /messaging/whatsapp/webhook  ──>  engagement({ policies: [whatsapp, web] })
                                                            │
                                                            ▼
                                                     createMessagingRouter
                                                            +
                                                     shared Runtime + support flow
```

## Setup

```bash
npm install
cp .env.example .env   # then fill it in
```

You need:
1. A **Meta Developer** app with **WhatsApp Cloud API** and a phone number added (Phone Number ID, a permanent access token, App Secret, WABA ID).
2. A **Verify Token** — any secret string you choose (used for Meta webhook verification).
3. An **OpenAI API key** (`OPENAI_API_KEY`).

## Run

```bash
npm run dev        # starts the server on PORT (default 3333)
```

If required env vars are missing, the server prints setup instructions and exits cleanly.

Expose it for Meta's webhook (local dev with [ngrok](https://ngrok.com)):

```bash
ngrok http 3333
```

In the Meta dashboard, configure the WhatsApp webhook:

| Field | Value |
|-------|-------|
| Callback URL | `https://<host>/messaging/whatsapp/webhook` |
| Verify token | the same value as `WHATSAPP_VERIFY_TOKEN` |

Subscribe to the `messages` field (and `message_template_status_update` if you use templates).

## Offline smoke

```bash
npm run smoke      # mounts the app, verifies the Meta webhook handshake + /health — no live Meta or model
```

## Deploy

Runs anywhere with Node 20+ (or Bun):

```bash
npm start          # or: npx tsx src/server.ts
```

Set all env vars in your host's secret manager and point Meta's webhook at your public URL. Set **`REDIS_URL`** in production for a durable conversation window store that survives restarts and replicas (in-memory otherwise). For edge/serverless, mount `createMessagingRouter` on a Cloudflare Worker via `@kuralle-agents/cf-agent`.

## Files

| File | Purpose |
|------|---------|
| `src/server.ts` | Entry — loads `.env`, guards required vars, serves (Node or Bun) |
| `src/app.ts` | `createWhatsAppApp()` — runtime, engagement policies, router mount, `/health` |
| `src/window-store.ts` | `InMemoryWindowStore`, or `createRedisWindowStore` when `REDIS_URL` is set |
| `src/model.ts` | OpenAI model resolver (`OPENAI_MODEL`) |
| `src/env.ts` | Missing-env detection + setup instructions |
| `src/smoke.ts` | Offline webhook-verification + health smoke |
