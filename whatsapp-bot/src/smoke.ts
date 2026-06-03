import type { LanguageModel } from 'ai';
import { InMemoryWindowStore } from '@kuralle-agents/messaging';
import { createWhatsAppClient } from '@kuralle-agents/messaging-meta/whatsapp';
import { createWhatsAppApp } from './app.js';

/**
 * Offline smoke — no live Meta, no model calls. Verifies the Hono app mounts the
 * messaging router and answers Meta's webhook verification (GET challenge) + /health.
 */
const VERIFY_TOKEN = 'test-verify-token';

async function main(): Promise<void> {
  const whatsapp = createWhatsAppClient({
    accessToken: 'test-access-token',
    appSecret: 'test-app-secret',
    phoneNumberId: '123456789',
    verifyToken: VERIFY_TOKEN,
  });

  // The model is never invoked by the webhook-verify GET or /health.
  const model = {} as LanguageModel;

  const app = createWhatsAppApp({
    whatsapp,
    model,
    wabaId: 'waba-test',
    windowStore: new InMemoryWindowStore(),
    selector: { select: async () => null },
  });

  const challenge = 'challenge-abc-123';
  const verifyUrl =
    'http://localhost/messaging/whatsapp/webhook' +
    '?hub.mode=subscribe' +
    `&hub.verify_token=${encodeURIComponent(VERIFY_TOKEN)}` +
    `&hub.challenge=${encodeURIComponent(challenge)}`;

  const verifyRes = await app.fetch(new Request(verifyUrl));
  const verifyBody = await verifyRes.text();
  if (verifyRes.status !== 200 || verifyBody !== challenge) {
    throw new Error(`webhook verification failed: ${verifyRes.status} "${verifyBody}"`);
  }

  const healthRes = await app.fetch(new Request('http://localhost/health'));
  const health = (await healthRes.json()) as { status: string };
  if (healthRes.status !== 200 || health.status !== 'ok') {
    throw new Error(`health check failed: ${healthRes.status}`);
  }

  console.log('✓ smoke passed — webhook verification + health OK (offline, no live Meta/model)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
