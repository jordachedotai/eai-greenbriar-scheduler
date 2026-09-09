// Server-only. Called from the API route and from scripts/gen-mock.ts.
// Never import this from a component.

import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./prompts";

export const MODEL = "claude-sonnet-5";
export const MAX_TOKENS = 2500;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  // Zero-arg: reads ANTHROPIC_API_KEY, ANTHROPIC_AUTH_TOKEN, or an ant profile.
  if (!client) client = new Anthropic();
  return client;
}

export async function callClaude(userPrompt: string): Promise<string> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });
  if (response.stop_reason === "refusal") {
    throw new Error("The model declined this request.");
  }
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("Empty reply from the model.");
  return text;
}
