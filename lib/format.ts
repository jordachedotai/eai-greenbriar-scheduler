// Display helpers. All timestamps render in Central Time.

export function shortName(full: string): string {
  const parts = full.split(" ");
  return parts.length > 1 ? `${parts[0][0]}. ${parts[parts.length - 1]}` : full;
}

export function firstName(full: string): string {
  return full.split(" ")[0];
}

export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

const TZ = "America/Chicago";

export function fmtStamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: TZ });
}

// "since Tue 3:05pm", or "since 8:14am" when it was today.
export function sinceLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const sameDay = d.toLocaleDateString("en-US", { timeZone: TZ }) === now.toLocaleDateString("en-US", { timeZone: TZ });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ }).toLowerCase().replace(" ", "");
  if (sameDay) return `since ${time} today`;
  const day = d.toLocaleDateString("en-US", { weekday: "short", timeZone: TZ });
  return `since ${day} ${time}`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
