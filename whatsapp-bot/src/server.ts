import 'dotenv/config';
import { createWhatsAppClient } from '@kuralle-agents/messaging-meta/whatsapp';
import { createWhatsAppApp } from './app.js';
import {
  getMissingWhatsAppEnv,
  printMissingModelInstructions,
  printSetupInstructions,
} from './env.js';
import { resolveModel } from './model.js';
import { createWindowStore } from './window-store.js';

type BunRuntime = {
  serve: (opts: {
    fetch: (request: Request) => Response | Promise<Response>;
    port: number;
  }) => void;
};

function getBun(): BunRuntime | undefined {
  return (globalThis as { Bun?: BunRuntime }).Bun;
}

async function main(): Promise<void> {
  const missing = getMissingWhatsAppEnv();
  if (missing.length > 0) {
    printSetupInstructions(missing);
    process.exit(0);
  }

  const resolved = resolveModel();
  if (!resolved) {
    printMissingModelInstructions();
    process.exit(0);
  }

  const whatsapp = createWhatsAppClient({
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    appSecret: process.env.WHATSAPP_APP_SECRET!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN!,
  });

  const windowStore = await createWindowStore();
  const app = createWhatsAppApp({
    whatsapp,
    model: resolved.model,
    wabaId: process.env.WHATSAPP_WABA_ID!,
    windowStore,
  });

  const port = Number(process.env.PORT ?? 3333);
  console.log(`
  WhatsApp bot (${resolved.label}) on port ${port}

  Webhook:     http://localhost:${port}/messaging/whatsapp/webhook
  Health:      http://localhost:${port}/health
  WindowStore: ${process.env.REDIS_URL ? 'redis' : 'in-memory'}
`);

  const bun = getBun();
  if (bun) {
    bun.serve({ fetch: app.fetch, port });
    return;
  }
  const { serve } = await import('@hono/node-server');
  serve({ fetch: app.fetch, port });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
