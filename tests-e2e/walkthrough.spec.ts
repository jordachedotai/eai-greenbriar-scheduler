// The v2 demo walkthrough in mock mode, per docs/DEMO_SCRIPT.md.
// AIT Worldwide Logistics through all five stages using only on-screen
// buttons and the demo controls. Fails on any console error.

import { expect, test, type Page } from "@playwright/test";

async function waitForAgent(page: Page) {
  await page.waitForSelector('[data-testid="working"]', { state: "detached", timeout: 15_000 });
}

async function signIn(page: Page) {
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByTestId("sign-in").click();
  await expect(page).toHaveURL(/\/portfolio$/);
  await expect(page.getByTestId("rows-view")).toBeVisible();
}

test("Beat 0 to 5: AIT from not started to locked", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  // Beat 0: the morning view.
  await signIn(page);
  await expect(page.getByTestId("count-you")).toHaveText("1");
  await expect(page.getByTestId("count-others")).toHaveText("3");
  await expect(page.getByTestId("count-notStarted")).toHaveText("1");
  await expect(page.getByTestId("count-confirmed")).toHaveText("4 of 20");
  await expect(page.getByTestId("row-ait-worldwide-logistics").getByTestId("row-waiting")).toHaveText("Not started");
  await expect(page.getByTestId("row-ait-worldwide-logistics").locator("[data-testid='face']")).toHaveCount(5);
  await expect(page.getByTestId("row-ait-worldwide-logistics").getByTestId("logo-tile").locator("img")).toHaveAttribute("src", /ait-worldwide-logistics/);

  // Beat 1: find dates.
  await page.getByTestId("row-action-ait-worldwide-logistics").click();
  await expect(page).toHaveURL(/\/portfolio\/ait-worldwide-logistics$/);
  await expect(page.getByTestId("header-title")).toHaveText("AIT Worldwide Logistics");
  await expect(page.getByTestId("step-1")).toHaveAttribute("data-state", "current");
  await expect(page.getByTestId("primary-action")).toHaveText("Find dates");
  await page.getByTestId("primary-action").click();
  await expect(page.getByTestId("explain")).toContainText("Checked calendars for Michael Wang, Jill Raker, Niall McComiskey, Max Elgart and Ben Cox");
  await expect(page.getByTestId("explain")).toContainText("Helen Marsh, Raymond Cho and Denise Walker have not shared calendars");
  await expect(page.getByTestId("explain")).toContainText("Tom Haggerty picks from the options in step 3");
  await expect(page.getByTestId("thin-Q3")).toContainText("Only 2 windows in Q3");
  await expect(page.getByTestId("explain").locator("[data-testid='face']")).toHaveCount(9);
  await expect(page.getByTestId("shortlist-Q1").locator('[data-testid="window"]')).toHaveCount(3);
  await waitForAgent(page);
  await expect(page.getByTestId("draft-onepager").getByTestId("draft-text")).toContainText("Dear Tom");
  await expect(page.getByTestId("draft-onepager").getByTestId("draft-text")).not.toContainText("{{");
  await page.getByTestId("see-all-windows").click();
  await expect(page.getByTestId("all-windows")).toBeVisible();
  await expect(page.getByTestId("primary-action")).toHaveText("Approve one-pager");
  await page.getByTestId("primary-action").click();

  // Beat 2: partner sign-off.
  await expect(page.getByTestId("step-2")).toHaveAttribute("data-state", "current");
  await expect(page.getByTestId("step-1")).toHaveAttribute("data-state", "done");
  await waitForAgent(page);
  await expect(page.getByTestId("draft-partnerEmail").locator("[data-part='subject']")).toContainText("AIT Worldwide Logistics");
  await expect(page.getByTestId("draft-partnerEmail").locator("[data-part='signoff']")).toContainText("Executive Assistant");
  await expect(page.getByTestId("primary-action")).toHaveText("Approve and send to partners");
  await page.getByTestId("primary-action").click();
  await expect(page.getByTestId("waiting-state")).toContainText("Waiting on the partners");
  await expect(page.getByTestId("primary-action")).toBeDisabled();
  await page.getByTestId("sim-partner-replies").click();
  await expect(page.getByTestId("partner-replies").locator("[data-state='yes']")).toHaveCount(5);
  await expect(page.getByTestId("timeline")).toContainText("Ben Cox replied yes.");
  await expect(page.getByTestId("primary-action")).toHaveText("Draft the email to the company");
  await page.getByTestId("primary-action").click();

  // Beat 3: portco picks.
  await expect(page.getByTestId("step-3")).toHaveAttribute("data-state", "current");
  await waitForAgent(page);
  await expect(page.getByTestId("draft-portcoEmail").getByTestId("draft-text")).toContainText("Dear Tom");
  await expect(page.getByTestId("primary-action")).toHaveText("Approve and send to the company");
  await page.getByTestId("primary-action").click();
  await expect(page.getByTestId("waiting-state")).toContainText("Waiting on the company");
  await page.getByTestId("sim-portco-picks").click();
  await expect(page.getByTestId("portco-picks")).toContainText("option");
  await expect(page.getByTestId("quarter-Q1")).not.toContainText("No dates yet");
  await expect(page.getByTestId("quarter-strip").getByTestId("chip-Q1")).toHaveAttribute("data-status", "partnersSignedOff");
  await expect(page.getByTestId("primary-action")).toHaveText("Draft the email to the board");
  await page.getByTestId("primary-action").click();

  // Beat 4: board confirms, with the conflict.
  await expect(page.getByTestId("step-4")).toHaveAttribute("data-state", "current");
  await waitForAgent(page);
  await expect(page.getByTestId("draft-boardEmail").getByTestId("draft-text")).toContainText("Helen Marsh, Raymond Cho and Denise Walker");
  await expect(page.getByTestId("draft-boardEmail").locator("[data-part='list'] li")).toHaveCount(4);
  await expect(page.getByTestId("primary-action")).toHaveText("Approve and send to board");
  await page.getByTestId("primary-action").click();
  await expect(page.getByTestId("waiting-state")).toContainText("Waiting on the board");
  await page.getByTestId("sim-board-conflict").click();
  await expect(page.getByTestId("conflict-Q3")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("conflict-Q3")).toContainText("Raymond Cho declined Q3");
  await expect(page.getByTestId("resp-Q3-b2")).toHaveAttribute("data-response", "declined");
  await expect(page.getByTestId("reverify")).toContainText("still free");
  await expect(page.getByTestId("conflict-Q3")).toContainText("option 2 on the shortlist the partners approved");
  // Decline view: the sent board email folds to one line, the re-send is the only full-size draft.
  await expect(page.getByTestId("draft-boardEmail")).toHaveAttribute("data-collapsed", "true");
  await expect(page.getByTestId("draft-conflict")).toContainText("Re-send to the board: Q3 date change");
  await expect(page.getByTestId("draft-conflict").locator("[data-part='subject']")).toContainText("Q3");
  await expect(page.getByTestId("draft-conflict").locator("[data-part='list'] li")).toHaveCount(1);
  await page.getByTestId("draft-expand").click();
  await expect(page.getByTestId("draft-boardEmail").locator("[data-part='subject']")).toBeVisible();
  await page.getByTestId("draft-collapse").click();
  await expect(page.getByTestId("primary-action")).toHaveText("Approve and re-send to board");
  await page.getByTestId("primary-action").click();
  await expect(page.getByTestId("resp-Q3-b2")).toHaveAttribute("data-response", "pending");
  await expect(page.getByTestId("waiting-state")).toContainText("Waiting on the board");
  await page.getByTestId("sim-board-confirms").click();
  await expect(page.getByTestId("resp-Q3-b2")).toHaveAttribute("data-response", "confirmed");
  await expect(page.getByTestId("primary-action")).toHaveText("Lock and book");

  // Beat 5: lock and book.
  await page.getByTestId("primary-action").click();
  await expect(page.getByTestId("step-5")).toHaveAttribute("data-state", "current");
  await waitForAgent(page);
  await expect(page.getByTestId("logistics-Q1")).toContainText("miles from the office");
  await expect(page.getByTestId("primary-action")).toHaveText("Approve and lock");
  await page.getByTestId("primary-action").click();
  await expect(page.getByTestId("quarter-strip").locator("[data-final='true']")).toHaveCount(4);
  await expect(page.getByTestId("primary-action")).toHaveCount(0);
  await expect(page.getByTestId("action-hint")).toContainText("All four meetings are locked");

  // A done step opens read-only.
  await page.getByTestId("step-4").click();
  await expect(page.getByTestId("board-matrix")).toBeVisible();
  await expect(page.getByTestId("action-bar")).toContainText("read only");
  await page.getByTestId("back-to-current").click();

  // Work strip: confirmed 8 of 20.
  await page.getByTestId("nav-portfolio").click();
  await expect(page.getByTestId("count-confirmed")).toHaveText("8 of 20");
  await expect(page.getByTestId("count-notStarted")).toHaveText("0");

  // Beat 6: scale picture.
  await page.getByTestId("ea-all").click();
  await expect(page.getByTestId("rows-view").locator("[data-row]")).toHaveCount(18);
  await expect(page.getByTestId("count-confirmed")).toHaveText("20 of 72");
  await expect(page.getByTestId("row-ontrac").getByTestId("row-ea")).toHaveText("Barbara Palmer");
  await page.getByTestId("view-board").click();
  await expect(page.getByTestId("board-view")).toBeVisible();
  await expect(page.getByTestId("column-count-5")).toHaveText("5");
  await page.getByTestId("nav-calendar").click();
  await expect(page.getByTestId("year-view")).toBeVisible();
  await expect(page.getByTestId("cal-locked")).toHaveText("20 confirmed");

  // Reload: state persists.
  await page.reload();
  await expect(page.getByTestId("year-view")).toBeVisible();

  expect(errors, errors.join("\n")).toEqual([]);
});

test("If time is short: council-at-board starts at Beat 4", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await signIn(page);
  await page.getByTestId("presenter-toggle").click();
  await page.getByTestId("jump-state").selectOption("council-at-board");
  await page.getByTestId("presenter-toggle").click();
  await expect(page.getByTestId("row-ait-worldwide-logistics").getByTestId("row-waiting")).toHaveText("Needs you");
  await page.getByTestId("row-action-ait-worldwide-logistics").click();
  await expect(page.getByTestId("step-4")).toHaveAttribute("data-state", "current");
  await expect(page.getByTestId("primary-action")).toHaveText("Approve and send to board");
  await expect(page.getByTestId("draft-boardEmail").getByTestId("draft-text")).not.toContainText("{{");
  await page.getByTestId("primary-action").click();
  await page.getByTestId("sim-board-conflict").click();
  await expect(page.getByTestId("conflict-Q3")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("primary-action").click();
  await page.getByTestId("sim-board-confirms").click();
  await page.getByTestId("primary-action").click();
  await waitForAgent(page);
  await page.getByTestId("primary-action").click();
  await expect(page.getByTestId("quarter-strip").locator("[data-final='true']")).toHaveCount(4);
  expect(errors).toEqual([]);
});

test("Work strip filters, demo buttons hide, reset restores council", async ({ page }) => {
  await signIn(page);
  await page.getByTestId("strip-others").click();
  await expect(page.getByTestId("rows-view").locator("[data-row]")).toHaveCount(3);
  await page.getByTestId("strip-others").click();
  await expect(page.getByTestId("rows-view").locator("[data-row]")).toHaveCount(5);

  // Hide demo buttons: the waiting state keeps its text, loses the button.
  await page.getByTestId("row-action-sparkstone-electrical-group").click();
  await expect(page.getByTestId("sim-partner-replies")).toBeVisible();
  await page.keyboard.press("Shift+P");
  await page.getByTestId("toggle-demo-buttons").click();
  await expect(page.getByTestId("sim-partner-replies")).toHaveCount(0);
  await expect(page.getByTestId("waiting-state")).toContainText("Waiting on the partners");
  await page.getByTestId("toggle-demo-buttons").click();
  await page.getByTestId("presenter-reset").click();
  await expect(page).toHaveURL(/\/portfolio$/);
  await expect(page.getByTestId("count-confirmed")).toHaveText("4 of 20");

  // Sidebar collapses and the login guard holds.
  await page.getByTestId("sidebar-toggle").click();
  await expect(page.getByTestId("sidebar")).toHaveAttribute("data-collapsed", "true");
  await page.getByTestId("nav-people").click();
  await expect(page.getByTestId("header-title")).toHaveText("People");
});
