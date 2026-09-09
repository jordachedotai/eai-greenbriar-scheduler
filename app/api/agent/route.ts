// Live mode only. The key stays server-side. Mock mode never hits this.

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildPrompt, type AgentStep } from "@/lib/prompts";
import { callClaude } from "@/lib/claude";

const STEPS: AgentStep[] = ["shortlist", "portcoEmail", "boardEmail", "conflict", "logistics"];

export async function POST(req: Request) {
  let body: { step?: string; payload?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request body" }, { status: 400 });
  }
  const step = body.step as AgentStep;
  if (!STEPS.includes(step)) {
    return NextResponse.json({ error: `Unknown step: ${body.step}` }, { status: 400 });
  }
  try {
    const text = await callClaude(buildPrompt(step, body.payload));
    return NextResponse.json({ text });
  } catch (err) {
    const message =
      err instanceof Anthropic.AuthenticationError
        ? "No API credentials on the server."
        : err instanceof Anthropic.RateLimitError
          ? "Rate limited."
          : err instanceof Anthropic.APIError
            ? `API error ${err.status}`
            : err instanceof Error
              ? err.message
              : "Unknown error";
    console.error("[agent]", step, message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
