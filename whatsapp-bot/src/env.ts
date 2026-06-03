export const WHATSAPP_ENV_VARS = [
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_APP_SECRET',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_VERIFY_TOKEN',
  'WHATSAPP_WABA_ID',
] as const;

export function getMissingWhatsAppEnv(): string[] {
  return WHATSAPP_ENV_VARS.filter((name) => !process.env[name]?.trim());
}

export function printSetupInstructions(missing: string[]): void {
  console.log(`
WhatsApp bot — missing required environment variables:

  ${missing.join('\n  ')}

Bring your own WhatsApp Cloud API number and token (no Embedded Signup):

  1. Create a Meta Developer app with WhatsApp Cloud API enabled
  2. Add a phone number, copy its Phone Number ID + a permanent access token
  3. Choose any Verify Token (a secret string you pick)
  4. Copy the App Secret from Meta app settings
  5. Copy the WhatsApp Business Account ID (WABA ID)

Copy .env.example to .env and fill it in, then run \`npm run dev\`.
Webhook URL (after deploy or ngrok): https://<host>/messaging/whatsapp/webhook
`);
}

export function printMissingModelInstructions(): void {
  console.log(`
WhatsApp bot — no model API key found.

Set OPENAI_API_KEY (and optionally OPENAI_MODEL) in your .env.
`);
}
