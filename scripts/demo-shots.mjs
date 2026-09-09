// Dev helper: walks the demo in mock mode and saves a screenshot per beat.
//   node scripts/demo-shots.mjs <outDir> [baseUrl]
import { chromium } from "@playwright/test";

const out = process.argv[2] ?? ".";
const base = process.argv[3] ?? "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const t = (id) => page.getByTestId(id);
const agent = () => page.waitForSelector('[data-testid="working"]', { state: "detached", timeout: 15000 });
const shot = (name) => page.screenshot({ path: `${out}/${name}.png` });

await page.goto(base, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });
await t("card-pc1").click();
await t("stage-button").click();
await shot("1-availability");
await t("stage-button").click();
await agent();
await shot("2-shortlist");
await t("draft-onepager").getByTestId("draft-approve").click();
await page.keyboard.press("Shift+P");
await t("sim-approvals").click();
await shot("3-approval");
await t("stage-button").click();
await agent();
await t("draft-portco-email").getByTestId("draft-approve").click();
await t("sim-portco-reply").click();
await shot("4-portco");
await t("stage-button").click();
await agent();
await t("draft-board-email").getByTestId("draft-approve").click();
await t("sim-board-conflict").click();
await t("conflict-Q3").waitFor();
await shot("5-conflict");
await t("draft-conflict").getByTestId("draft-approve").click();
await t("sim-board-confirm").click();
await t("stage-button").click();
await agent();
await shot("6-logistics");
await t("stage-button").click();
await shot("7-locked");
await page.keyboard.press("Escape");
await page.keyboard.press("Shift+P");
await shot("8-board");
await browser.close();
console.log("done");
