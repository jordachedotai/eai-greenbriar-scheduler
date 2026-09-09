// Dev helper: opens the board in headless Chromium, clicks the first card,
// and writes screenshots plus any console errors. Usage:
//   node scripts/smoke-shot.mjs <outDir> [baseUrl]
import { chromium } from "@playwright/test";

const out = process.argv[2] ?? ".";
const base = process.argv[3] ?? "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(base, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="card-pc1"]');
await page.screenshot({ path: `${out}/board.png` });
const counts = await page.$$eval('[data-testid^="column-count-"]', (els) => els.map((e) => e.textContent));
const locked = await page.textContent('[data-testid="metric-meetings-locked"]');
await page.click('[data-testid="card-pc1"]');
await page.waitForSelector('[data-testid="portco-drawer"]');
await page.screenshot({ path: `${out}/drawer.png` });
await page.keyboard.press("Escape");
await page.waitForSelector('[data-testid="portco-drawer"]', { state: "detached" });
console.log(JSON.stringify({ counts, locked, errors }));
await browser.close();
