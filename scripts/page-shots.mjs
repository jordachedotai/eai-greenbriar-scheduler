// Dev helper: screenshots of the secondary pages and the after-lock panel.
//   node scripts/page-shots.mjs <outDir> [baseUrl]
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
await shot("p0-login");
await t("sign-in").click();
await t("rows-view").waitFor();
await t("nav-calendar").click();
await t("year-view").waitFor();
await shot("p1-calendar");
await t("nav-people").click();
await t("person-jill-raker").click();
await shot("p2-people");
await t("nav-settings").click();
await t("settings-calendars").waitFor();
await shot("p3-settings-top");
await page.evaluate(() => document.getElementById("teams")?.scrollIntoView());
await shot("p4-settings-teams");
await t("nav-templates").click();
await t("template-onepager").waitFor();
await shot("p5-templates");
// Attendance: open a locked company under all assistants.
await t("nav-portfolio").click();
await t("ea-all").click();
await t("row-action-ontrac").click();
await t("attendance").waitFor();
await shot("p6-attendance");
await browser.close();
console.log("done");
