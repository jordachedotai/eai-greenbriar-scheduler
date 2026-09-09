"use client";

// One entry point for every agent step. Mock renders templates over the
// payload with a short working delay, so the text always matches the dates
// on screen. Live posts to /api/agent and falls back to mock if the call
// fails, tagging the draft "offline". The UI never knows which ran.

import { extractJson, type AgentStep } from "./prompts";
import { fillTokens } from "./text";
import { mockStep } from "./mockAgent";
import type { Quarter } from "./types";

export type AgentOutcome<T> = { data: T; offline: boolean };

const MOCK_DELAY_MIN = 1200;
const MOCK_DELAY_MAX = 2500;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export type RunOptions = {
  mock: boolean;
  portcoId: string;
  quarter?: Quarter;
  variant?: number;
  tokens?: Record<string, string>;
  expectJson: boolean;
};

async function fromMock<T>(step: AgentStep, payload: unknown, opts: RunOptions): Promise<T> {
  await sleep(MOCK_DELAY_MIN + Math.random() * (MOCK_DELAY_MAX - MOCK_DELAY_MIN));
  return fillTokens(mockStep(step, payload, opts.variant ?? 0) as T, opts.tokens ?? {});
}

async function fromLive<T>(step: AgentStep, payload: unknown, opts: RunOptions): Promise<T> {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ step, payload }),
  });
  const body = (await res.json()) as { text?: string; error?: string };
  if (!res.ok || !body.text) throw new Error(body.error ?? `Agent call failed (${res.status})`);
  return opts.expectJson ? extractJson<T>(body.text) : (body.text as T);
}

export async function runAgent<T>(step: AgentStep, payload: unknown, opts: RunOptions): Promise<AgentOutcome<T>> {
  if (opts.mock) {
    return { data: await fromMock<T>(step, payload, opts), offline: false };
  }
  try {
    return { data: await fromLive<T>(step, payload, opts), offline: false };
  } catch (err) {
    console.warn("[agent] live call failed, serving offline draft:", err instanceof Error ? err.message : err);
    return { data: await fromMock<T>(step, payload, opts), offline: true };
  }
}
