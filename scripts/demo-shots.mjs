// Dev helper: walks the v2 demo in mock mode and saves a screenshot per beat.
//   node scripts/demo-shots.mjs <outDir> [baseUrl]
import { chromium } from "@playwright/test";

const out = process.argv[2] ?? ".";
const base = process.argv[3] ?? "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const t = (id) => page.getByTestId(id);
const agent = () => page.waitForSelector('[data-testid="working"]', { state: "detached", timeout: 15000 });
const shot = (name) => page.screenshot({ path: `${out}/${name}.png` });
const primary = async () => {
  await t("primary-action").click();
};

await page.goto(`${base}/login`, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });
await shot("0-login");
await t("sign-in").click();
await t("rows-view").waitFor();
await shot("1-portcos-rows");

await t("row-action-ait-worldwide-logistics").click();
await t("primary-action").waitFor();
await shot("2-detail-idle");
await primary();
await agent();
await shot("3-find-dates");
await primary(); // approve one-pager
await agent();
await shot("4-partner-draft");
await primary(); // send to partners
await shot("5-waiting-partners");
await t("sim-partner-replies").click();
await primary(); // draft portco email
await agent();
await primary(); // send to portco
await t("sim-portco-picks").click();
await shot("6-portco-picked");
await primary(); // draft board email
await agent();
await primary(); // send to board
await t("sim-board-conflict").click();
await t("conflict-Q3").waitFor();
await shot("7-conflict");
await primary(); // re-send
await t("sim-board-confirms").click();
await primary(); // lock and book
await agent();
await shot("8-lock-review");
await primary(); // approve and lock
await shot("9-locked");

await t("nav-portcos").click();
await t("rows-view").waitFor();
await t("ea-all").click();
await shot("10-all-eas-rows");
await t("view-board").click();
await shot("11-all-eas-board");
await t("nav-calendar").click();
await t("year-view").waitFor();
await shot("12-calendar");
await browser.close();
console.log("done");
