// Dev helper: screenshots of the planning-window screens.
//   node scripts/window-shots.mjs <outDir> [baseUrl]
import { chromium } from "@playwright/test";

const out = process.argv[2] ?? ".";
const base = process.argv[3] ?? "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const t = (id) => page.getByTestId(id);
const shot = (name) => page.screenshot({ path: `${out}/${name}.png` });

await page.goto(`${base}/login`, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });
await t("sign-in").click();
await t("rows-view").waitFor();
await t("ea-all").click();
await t("row-the-facilities-group").scrollIntoViewIfNeeded();
await shot("w1-rows-windows");
await t("row-action-the-facilities-group").click();
await t("quarter-strip").waitFor();
await shot("w2-facilities-detail");
await t("nav-calendar").click();
await t("year-2026").waitFor();
await shot("w3-calendar-two-years");
await t("nav-portfolio").click();
await t("ea-mine").click();
await t("row-action-ait-worldwide-logistics").click();
await t("looking-for-change").click();
await t("window-start").selectOption("2026-Q4");
await t("window-count").selectOption("2");
await shot("w4-change-window");
await t("window-save").click();
await shot("w5-window-set");
await browser.close();
console.log("done");
