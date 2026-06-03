import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

export interface ResolvedModel {
  model: LanguageModel;
  label: string;
}

/** OpenAI by default; returns null when no key is set so the server can exit cleanly. */
export function resolveModel(): ResolvedModel | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  const id = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
  return { model: createOpenAI({ apiKey })(id), label: `openai:${id}` };
}
