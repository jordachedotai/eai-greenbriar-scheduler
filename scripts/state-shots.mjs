// Dev helper: loads each saved demo state and screenshots the board.
//   node scripts/state-shots.mjs <outDir> [baseUrl]
import { chromium } from "@playwright/test";

const out = process.argv[2] ?? ".";
const base = process.argv[3] ?? "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });
await page.getByTestId("card-pc1").waitFor();
await page.keyboard.press("Shift+P");
for (const name of ["all-in-flight", "one-portco-at-board"]) {
  await page.getByTestId("jump-state").selectOption(name);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/state-${name}.png` });
}
await page.getByTestId("card-pc1").click();
await page.getByTestId("portco-drawer").waitFor();
await page.screenshot({ path: `${out}/state-drawer.png` });
await browser.close();
console.log("done");
