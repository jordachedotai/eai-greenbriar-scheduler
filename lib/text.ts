// Small text helpers shared by the agent layer and the data layer.

// Replace {{token}} markers anywhere in a string, array, or object.
export function fillTokens<T>(value: T, tokens: Record<string, string>): T {
  if (typeof value === "string") {
    let s: string = value;
    for (const [k, v] of Object.entries(tokens)) s = s.split(`{{${k}}}`).join(v);
    return s as T;
  }
  if (Array.isArray(value)) return value.map((v) => fillTokens(v, tokens)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = fillTokens(v, tokens);
    return out as T;
  }
  return value;
}
