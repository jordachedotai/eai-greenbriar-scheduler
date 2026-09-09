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
  await expect(page.getByTestId("picker-partners").locator("[data-checked='true']")).toHaveCount(5);
  await expect(page.getByTestId("picker-email").locator("[data-testid^='picker-']")).toHaveCount(4);
  await expect(page.getByTestId("action-hint")).toContainText("Step 1 of 6. Checks 5 calendars");
  await expect(page.getByTestId("looking-for")).toContainText("Four 4-hour blocks, Q1 2027 to Q4 2027, one per quarter, dinner at 6:30pm");
  await expect(page.getByTestId("primary-action")).toHaveText("Find dates");
  await page.getByTestId("primary-action").click();
  await expect(page.getByTestId("explain")).toHaveText("Approving moves it to the partners for sign-off.");
  await expect(page.getByTestId("who-calendars")).toContainText("Michael Wang, Jill Raker, Niall McComiskey, Max Elgart, Ben Cox");
  await expect(page.getByTestId("who-email")).toContainText("Helen Marsh, Raymond Cho, Denise Walker · in step 4");
  await expect(page.getByTestId("who-picks")).toContainText("Tom Haggerty · in step 3");
  await expect(page.getByTestId("who-skipped")).toContainText(/\d+ days already held for other portfolio company meetings/);
  await expect(page.getByTestId("thin-2027-Q3")).toContainText("Only 2 windows in Q3");
  await expect(page.getByTestId("who-block").locator("[data-testid='face']")).toHaveCount(9);
  await expect(page.getByTestId("shortlist-2027-Q1").locator('[data-testid="window"]')).toHaveCount(3);
  await waitForAgent(page);
  await expect(page.getByTestId("draft-onepager").getByTestId("draft-text")).toContainText("Dear Tom");
  await expect(page.getByTestId("draft-onepager").getByTestId("draft-text")).not.toContainText("{{");
  // The shortlist is editable and the one-pager follows. Swap a Q1 window in,
  // move it up, remove it, then put the original option 3 back.
  const q1 = page.getByTestId("shortlist-2027-Q1").locator("[data-testid='window']");
  const third = (await q1.nth(2).getAttribute("data-date")) as string;
  await page.getByTestId("see-all-windows").click();
  await expect(page.getByTestId("all-windows")).toBeVisible();
  const spare = page.getByTestId("all-windows-2027-Q1").locator("[data-testid='window'][data-selected='false']").first();
  const spareDate = (await spare.getAttribute("data-date")) as string;
  await spare.locator("[data-testid^='use-']").first().click();
  await expect(q1.nth(2)).toHaveAttribute("data-date", spareDate);
  const q1List = page.getByTestId("draft-onepager").locator("[data-part='list']").first().locator("li");
  await expect(q1List.nth(2)).toContainText(spareDate);
  await expect(page.getByTestId("timeline")).toContainText(`Swapped Q1 option 3 for ${spareDate}.`);
  await page.getByTestId("opt-up-2027-Q1-3").click();
  await expect(q1.nth(1)).toHaveAttribute("data-date", spareDate);
  await expect(q1List.nth(1)).toContainText(spareDate);
  await page.getByTestId("opt-remove-2027-Q1-2").click();
  await expect(q1).toHaveCount(2);
  await expect(q1List).toHaveCount(2);
  await expect(page.getByTestId("opt-remove-2027-Q1-1")).toBeDisabled();
  await page.getByTestId("all-windows-2027-Q1").locator(`[data-testid='window'][data-date='${third}']`).locator("[data-testid^='use-']").first().click();
  await expect(q1).toHaveCount(3);
  await expect(q1.nth(2)).toHaveAttribute("data-date", third);
  await expect(page.getByTestId("timeline")).toContainText(`Added ${third} as Q1 option 3.`);
  // The thin quarter keeps its two.
  await expect(page.getByTestId("opt-remove-2027-Q3-1")).toBeDisabled();
  await expect(page.getByTestId("primary-action")).toHaveText("Approve one-pager");
  await page.getByTestId("primary-action").click();

  // Beat 2: partner sign-off.
  await expect(page.getByTestId("step-2")).toHaveAttribute("data-state", "current");
  await expect(page.getByTestId("step-1")).toHaveAttribute("data-state", "done");
  await waitForAgent(page);
  await expect(page.getByTestId("draft-partnerEmail").locator("[data-part='subject']")).toContainText("AIT Worldwide Logistics");
  await expect(page.getByTestId("draft-partnerEmail").locator("[data-part='list']")).toHaveCount(4);
  await expect(page.getByTestId("draft-partnerEmail").locator("[data-part='signoff']")).toContainText("Peggy Conway, Executive Assistant to the Greenbriar Partners");
  await expect(page.getByTestId("draft-partnerEmail")).not.toContainText("attached");
  await expect(page.getByTestId("primary-action")).toHaveText("Approve and send to partners");
  await page.getByTestId("primary-action").click();
  await expect(page.getByTestId("waiting-state")).toContainText("Waiting on the partners");
  await expect(page.getByTestId("waiting-state").locator("button")).toHaveCount(0);
  await expect(page.getByTestId("primary-action")).toBeDisabled();
  await page.keyboard.press("Shift+P");
  await expect(page.getByTestId("presenter-menu")).toBeVisible();
  await expect(page.getByTestId("sim-partner-replies")).toHaveAttribute("data-state", "next");
  await page.getByTestId("sim-partner-replies").click();
  await expect(page.getByTestId("sim-partner-replies")).toHaveAttribute("data-state", "done");
  await expect(page.getByTestId("partner-replies").locator("[data-state='yes']")).toHaveCount(5);
  await expect(page.getByTestId("timeline")).toContainText("Ben Cox replied yes.");
  await expect(page.getByTestId("primary-action")).toHaveText("Draft the email to the company");
  await page.getByTestId("primary-action").click();

  // Beat 3: portco picks.
  await expect(page.getByTestId("step-3")).toHaveAttribute("data-state", "current");
  await waitForAgent(page);
  await expect(page.getByTestId("draft-portcoEmail").getByTestId("draft-text")).toContainText("Dear Tom");
  await expect(page.getByTestId("draft-portcoEmail").locator("[data-part='list']")).toHaveCount(4);
  await expect(page.getByTestId("attachment-chip")).toContainText("AIT Worldwide Logistics 2027 meeting options.pdf");
  await page.getByTestId("attachment-preview").click();
  await expect(page.getByTestId("preview-modal")).toContainText("Proposed quarterly meeting dates");
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("preview-modal")).toHaveCount(0);
  await expect(page.getByTestId("primary-action")).toHaveText("Approve and send to the company");
  await page.getByTestId("primary-action").click();
  await expect(page.getByTestId("waiting-state")).toContainText("Waiting on the company");
  await page.getByTestId("sim-portco-picks").click();
  await expect(page.getByTestId("portco-picks")).toContainText("option");
  // Provenance: every pick came from Tom's reply, and View opens it.
  await expect(page.getByTestId("pick-source-2027-Q1")).toContainText("from Tom's reply");
  await page.getByTestId("pick-view-2027-Q1").click();
  await expect(page.getByTestId("email-drawer-subject")).toContainText("Re: Proposed 2027 quarterly meeting dates");
  await expect(page.getByTestId("email-drawer-body")).toContainText("Q1");
  await page.getByTestId("email-drawer-close").click();
  await expect(page.getByTestId("email-drawer")).toHaveCount(0);
  await expect(page.getByTestId("quarter-2027-Q1")).not.toContainText("No date yet");
  await expect(page.getByTestId("quarter-2027-Q1")).toHaveAttribute("data-status", "partnersSignedOff");
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
  await expect(page.getByTestId("sim-board-conflict")).toHaveAttribute("data-state", "next");
  await page.getByTestId("sim-board-conflict").click();
  await expect(page.getByTestId("conflict-2027-Q3")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("conflict-2027-Q3")).toContainText("Raymond Cho declined Q3");
  await expect(page.getByTestId("conflict-2027-Q3")).toContainText("verified");
  await expect(page.getByTestId("detail-pill")).toHaveText("Needs you");
  await expect(page.getByTestId("resp-2027-Q3-b2")).toHaveAttribute("data-response", "declined");
  await expect(page.getByTestId("reverify")).toContainText("still free");
  await expect(page.getByTestId("conflict-2027-Q3")).toContainText("option 2 on the approved shortlist");
  // Decline view: the sent board email folds to one line, the re-send is the only full-size draft.
  await expect(page.getByTestId("draft-boardEmail")).toHaveAttribute("data-collapsed", "true");
  await expect(page.getByTestId("draft-conflict")).toContainText("Re-send to the board: Q3 date change");
  await expect(page.getByTestId("draft-conflict").locator("[data-part='subject']")).toContainText("Q3");
  await expect(page.getByTestId("draft-conflict").locator("[data-part='list'] li")).toHaveCount(1);
  // The declined cell opens Raymond's reply; the folded sent row opens the sent email.
  await page.getByTestId("resp-view-2027-Q3-b2").click();
  await expect(page.getByTestId("email-drawer-body")).toContainText("I cannot make Q3");
  await page.getByTestId("email-drawer-close").click();
  await page.getByTestId("draft-expand").click();
  await expect(page.getByTestId("email-drawer").locator("[data-part='subject']")).toContainText("dates to confirm");
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("email-drawer")).toHaveCount(0);
  await expect(page.getByTestId("primary-action")).toHaveText("Approve and re-send to board");
  await page.getByTestId("primary-action").click();
  await expect(page.getByTestId("resp-2027-Q3-b2")).toHaveAttribute("data-response", "pending");
  await expect(page.getByTestId("resp-2027-Q3-b1")).toContainText("Re-asking");
  await expect(page.getByTestId("waiting-state")).toContainText("Waiting on the board");
  await expect(page.getByTestId("sim-board-confirms")).toHaveAttribute("data-state", "next");
  await page.getByTestId("sim-board-confirms").click();
  await expect(page.getByTestId("resp-2027-Q3-b2")).toHaveAttribute("data-response", "confirmed");
  await expect(page.getByTestId("primary-action")).toHaveText("Lock and book");

  // Beat 5: lock and book.
  await page.getByTestId("primary-action").click();
  await expect(page.getByTestId("step-5")).toHaveAttribute("data-state", "current");
  await waitForAgent(page);
  await expect(page.getByTestId("logistics-2027-Q1")).toContainText("mi from the office");
  // Venues are cards, no native selects. Change opens the alternatives; Use this swaps one in.
  await expect(page.locator("select")).toHaveCount(0);
  await expect(page.getByTestId("venue-hotel-2027-Q2")).toContainText("mi from the office");
  const q2Hotel = (await page.getByTestId("venue-hotel-2027-Q2").getAttribute("data-venue")) as string;
  await page.getByTestId("venue-hotel-2027-Q2-change").click();
  await page.getByTestId("venue-hotel-2027-Q2-options").locator("[data-testid^='venue-hotel-2027-Q2-use-']").first().click();
  await expect(page.getByTestId("venue-hotel-2027-Q2")).not.toHaveAttribute("data-venue", q2Hotel);
  await expect(page.getByTestId("venue-hotel-2027-Q2-options")).toHaveCount(0);
  // The tool learns Peggy's venues: add one, it is selected, then use it for all four.
  await page.getByTestId("venue-restaurant-2027-Q1-change").click();
  await page.getByTestId("venue-restaurant-2027-Q1-add").click();
  await page.getByTestId("venue-restaurant-2027-Q1-name").fill("Gene and Georgetti Rosemont");
  await page.getByTestId("venue-restaurant-2027-Q1-address").fill("9421 West Higgins Road, Rosemont, IL");
  await page.getByTestId("venue-restaurant-2027-Q1-save").click();
  await expect(page.getByTestId("venue-restaurant-2027-Q1")).toContainText("Gene and Georgetti Rosemont");
  await expect(page.getByTestId("venue-restaurant-2027-Q1")).toContainText("Added by Peggy Conway");
  await page.getByTestId("venue-restaurant-2027-Q1-all").click();
  await expect(page.getByTestId("venue-restaurant-2027-Q4")).toHaveAttribute("data-venue", /custom:/);
  await expect(page.getByTestId("venue-restaurant-2027-Q4")).toContainText("Gene and Georgetti Rosemont");
  await expect(page.getByTestId("venue-restaurant-2027-Q4")).toContainText("Same as Q1");
  await expect(page.getByTestId("venue-restaurant-2027-Q1")).not.toContainText("Same as");
  await expect(page.getByTestId("primary-action")).toHaveText("Approve and lock");
  await page.getByTestId("primary-action").click();
  await expect(page.getByTestId("quarter-strip").locator("[data-final='true']")).toHaveCount(4);

  // Beat 6a: send invites. Four drafts, one per meeting, then replies from the presenter.
  await expect(page.getByTestId("step-6")).toHaveAttribute("data-state", "current");
  await expect(page.getByTestId("detail-pill")).toHaveText("Locked");
  await expect(page.getByTestId("invite-drafts").locator("[data-testid^='invite-']")).toHaveCount(4);
  await expect(page.getByTestId("invite-2027-Q1")).toContainText("AIT Worldwide Logistics quarterly meeting, Q1 2027");
  await expect(page.getByTestId("invite-2027-Q1").locator("[data-testid='face']")).toHaveCount(9);
  await expect(page.getByTestId("invite-2027-Q1")).toContainText("Gene and Georgetti Rosemont");
  await expect(page.getByTestId("sim-invites")).toHaveAttribute("data-state", "off");
  await expect(page.getByTestId("primary-action")).toHaveText("Approve and send invites");
  await page.getByTestId("primary-action").click();
  await expect(page.getByTestId("detail-pill")).toHaveText("Invites out");
  await expect(page.getByTestId("attendance-summary")).toContainText("No replies yet");
  await expect(page.getByTestId("invites-sent")).toContainText("Four calendar invites");
  await expect(page.getByTestId("sim-invites")).toHaveAttribute("data-state", "next");
  await page.getByTestId("sim-invites").click();
  await expect(page.getByTestId("attendance-summary")).toContainText("Invites accepted 34 of 36");
  await expect(page.getByTestId("inv-2027-Q2-b2")).toHaveAttribute("data-status", "tentative");
  await expect(page.getByTestId("inv-2027-Q4-ben-cox")).toHaveAttribute("data-status", "noReply");
  await expect(page.getByTestId("travel-michael-wang")).toHaveAttribute("data-status", "booked");
  await expect(page.getByTestId("travel-ben-cox")).toHaveAttribute("data-status", "pending");
  await expect(page.getByTestId("sim-invites")).toHaveAttribute("data-state", "done");
  await expect(page.getByTestId("sim-invites-all")).toHaveAttribute("data-state", "next");
  await page.getByTestId("sim-invites-all").click();
  await expect(page.getByTestId("detail-pill")).toHaveText("All accepted");
  await expect(page.getByTestId("primary-action")).toHaveCount(0);
  await expect(page.getByTestId("action-hint")).toContainText("All six steps done");

  // A done step opens read-only.
  await page.getByTestId("step-4").click();
  await expect(page.getByTestId("board-matrix")).toBeVisible();
  await expect(page.getByTestId("action-bar")).toContainText("read only");
  await page.getByTestId("back-to-current").click();

  await page.keyboard.press("Shift+P");
  await expect(page.getByTestId("presenter-menu")).toHaveCount(0);

  // Work strip: confirmed 8 of 20.
  await page.getByTestId("nav-portfolio").click();
  await expect(page.getByTestId("count-confirmed")).toHaveText("8 of 20");
  await expect(page.getByTestId("count-notStarted")).toHaveText("0");
  await expect(page.getByTestId("row-ait-worldwide-logistics").getByTestId("row-waiting")).toHaveText("All accepted");
  await expect(page.getByTestId("row-ait-worldwide-logistics").getByTestId("row-sentence")).toContainText("Every invite accepted. Travel booked for all partners.");
  await expect(page.getByTestId("row-ait-worldwide-logistics").locator("[data-step='6']")).toHaveAttribute("data-state", "locked");

  // Beat 6: scale picture.
  await page.getByTestId("ea-all").click();
  await expect(page.getByTestId("rows-view").locator("[data-row]")).toHaveCount(18);
  await expect(page.getByTestId("count-confirmed")).toHaveText("20 of 70");
  await expect(page.getByTestId("row-ontrac").getByTestId("row-ea")).toHaveText("Barbara Palmer");
  await page.getByTestId("view-board").click();
  await expect(page.getByTestId("board-view")).toBeVisible();
  await expect(page.getByTestId("column-count-6")).toHaveText("4");
  await expect(page.getByTestId("column-count-5")).toHaveText("1");
  // Two companies show other windows: Sunvair plans two quarters, The Facilities Group spans 2026 into 2027.
  await page.getByTestId("view-rows").click();
  await expect(page.getByTestId("row-sunvair-aerospace-group").locator("[data-testid^='chip-']")).toHaveCount(2);
  await expect(page.getByTestId("row-the-facilities-group").locator("[data-testid='chip-2026-Q4']")).toContainText("Q4 '26");
  await expect(page.getByTestId("row-the-facilities-group").locator("[data-testid='chip-2027-Q1']")).toContainText("Q1 '27");
  await page.getByTestId("nav-calendar").click();
  await expect(page.getByTestId("year-view")).toBeVisible();
  await expect(page.getByTestId("year-2026")).toBeVisible();
  await expect(page.getByTestId("year-2027")).toBeVisible();
  await expect(page.getByTestId("cal-locked")).toHaveText("20 locked");

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
  await page.getByTestId("jump-state").click();
  await page.getByTestId("jump-state-opt-council-at-board").click();
  await page.getByTestId("presenter-toggle").click();
  await expect(page.getByTestId("row-ait-worldwide-logistics").getByTestId("row-waiting")).toHaveText("Needs you");
  await page.getByTestId("row-action-ait-worldwide-logistics").click();
  await expect(page.getByTestId("step-4")).toHaveAttribute("data-state", "current");
  await expect(page.getByTestId("primary-action")).toHaveText("Approve and send to board");
  await expect(page.getByTestId("draft-boardEmail").getByTestId("draft-text")).not.toContainText("{{");
  await page.getByTestId("primary-action").click();
  await page.getByTestId("presenter-toggle").click();
  await page.getByTestId("sim-board-conflict").click();
  await expect(page.getByTestId("conflict-2027-Q3")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("primary-action").click();
  await page.getByTestId("sim-board-confirms").click();
  await page.getByTestId("primary-action").click();
  await waitForAgent(page);
  await page.getByTestId("primary-action").click();
  await expect(page.getByTestId("quarter-strip").locator("[data-final='true']")).toHaveCount(4);
  await expect(page.getByTestId("primary-action")).toHaveText("Approve and send invites");
  expect(errors).toEqual([]);
});

test("Work strip filters, demo buttons hide, reset restores council", async ({ page }) => {
  await signIn(page);
  await page.getByTestId("strip-others").click();
  await expect(page.getByTestId("rows-view").locator("[data-row]")).toHaveCount(3);
  await page.getByTestId("strip-others").click();
  await expect(page.getByTestId("rows-view").locator("[data-row]")).toHaveCount(5);

  // The waiting state has no inline button. The presenter menu shows the next step.
  await page.getByTestId("row-action-sparkstone-electrical-group").click();
  await expect(page.getByTestId("waiting-state")).toContainText("Waiting on the partners");
  await expect(page.getByTestId("waiting-state").locator("button")).toHaveCount(0);
  await page.keyboard.press("Shift+P");
  await expect(page.getByTestId("sim-partner-replies")).toHaveAttribute("data-state", "next");
  await expect(page.getByTestId("sim-portco-picks")).toHaveAttribute("data-state", "later");
  // Demo tag toggle hides the header tag.
  await expect(page.getByTestId("mode-tag")).toBeVisible();
  await page.getByTestId("toggle-demo-tag").click();
  await expect(page.getByTestId("mode-tag")).toHaveCount(0);
  await page.getByTestId("toggle-demo-tag").click();
  await page.getByTestId("presenter-reset").click();
  await expect(page).toHaveURL(/\/portfolio$/);
  await expect(page.getByTestId("count-confirmed")).toHaveText("4 of 20");

  // Sidebar collapses and the login guard holds.
  await page.getByTestId("sidebar-toggle").click();
  await expect(page.getByTestId("sidebar")).toHaveAttribute("data-collapsed", "true");
  await page.getByTestId("nav-people").click();
  await expect(page.getByTestId("header-title")).toHaveText("People");
});

test("Unchecking a partner removes them from the calendar check", async ({ page }) => {
  await signIn(page);
  await page.getByTestId("row-action-ait-worldwide-logistics").click();
  await expect(page.locator("select")).toHaveCount(0);
  await page.getByTestId("picker-add").click();
  await page.getByTestId("picker-add-select-opt-tucker-catlin").click();
  await expect(page.getByTestId("picker-partners").locator("[data-checked='true']")).toHaveCount(6);
  await page.getByTestId("picker-tucker-catlin-check").click();
  await page.getByTestId("picker-ben-cox-check").click();
  await expect(page.getByTestId("picker-ben-cox")).toHaveAttribute("data-checked", "false");
  await expect(page.getByTestId("action-hint")).toContainText("Checks 4 calendars");
  await page.getByTestId("primary-action").click();
  await expect(page.getByTestId("who-calendars")).toHaveText("Michael Wang, Jill Raker, Niall McComiskey, Max Elgart");
  await expect(page.getByTestId("shortlist-2027-Q1").locator("[data-testid='window']").first().locator("[data-testid='face']")).toHaveCount(4);
});

test("People, Templates, and Settings: add a company and change a team", async ({ page }) => {
  await signIn(page);

  // People: grouped roster, click a person to see their companies.
  await page.getByTestId("nav-people").click();
  await expect(page.getByTestId("people-investment").locator("[data-testid^='person-']")).toHaveCount(31);
  await page.getByTestId("person-jill-raker").click();
  await expect(page.getByTestId("person-companies").locator("li")).toHaveCount(5);
  // The person card is sticky: click someone lower down and the card swaps in place, the page does not scroll.
  await expect(page.getByTestId("person-panel")).toHaveCSS("position", "sticky");
  const last = page.getByTestId("people-operations").locator("[data-testid^='person-']").last();
  await last.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => document.querySelector("main")?.scrollTop ?? 0);
  expect(before).toBeGreaterThan(0);
  await last.click();
  await expect(page.getByTestId("person-panel")).toBeInViewport();
  expect(await page.evaluate(() => document.querySelector("main")?.scrollTop ?? 0)).toBe(before);

  // Templates: five read-only templates rendered by the email renderer.
  await page.getByTestId("nav-templates").click();
  await expect(page.locator("[data-testid='email-draft']")).toHaveCount(5);
  await expect(page.getByTestId("template-resend")).toContainText("Q3");

  // Settings: team assignment changes flow into Find dates.
  await page.getByTestId("nav-settings").click();
  await expect(page.getByTestId("calendar-connections")).toContainText("Connected");
  await expect(page.locator("select")).toHaveCount(0);
  await page.getByTestId("default-quarters").click();
  await page.getByTestId("default-quarters-opt-2").click();
  await expect(page.getByTestId("default-quarters")).toHaveAttribute("data-value", "2");
  await page.getByTestId("default-quarters").click();
  await page.getByTestId("default-quarters-opt-4").click();
  await page.getByTestId("team-edit-fragilepak").click();
  await page.getByTestId("team-picker-fragilepak-tucker-catlin").click();
  await page.getByTestId("team-save-fragilepak").click();
  await expect(page.getByTestId("team-count-fragilepak")).toHaveText("4");

  // Add a company with two roster people and a fictional board.
  await page.getByTestId("add-name").fill("Northgate Industrial");
  await page.getByTestId("add-city").fill("Columbus, OH");
  await page.getByTestId("add-address").fill("100 Main Street, Suite 400");
  await page.getByTestId("add-exec").fill("Dana Whitfield");
  await page.getByTestId("add-board-name-0").fill("Ora Lind");
  await page.getByTestId("add-board-name-1").fill("Sam Reyes");
  await page.getByTestId("add-team-claire-ponnaiya").click();
  await page.getByTestId("add-team-anay-saraf").click();
  await page.getByTestId("add-save").click();
  await expect(page).toHaveURL(/\/portfolio\/northgate-industrial$/);
  await expect(page.getByTestId("header-title")).toHaveText("Northgate Industrial");
  await expect(page.getByTestId("picker-partners").locator("[data-checked='true']")).toHaveCount(2);
  await expect(page.getByTestId("picker-email")).toContainText("Ora Lind");

  // Find dates works with generated calendars and generic venues, and the row shows up.
  await page.getByTestId("primary-action").click();
  await expect(page.getByTestId("who-calendars")).toHaveText("Claire Ponnaiya, Anay Saraf");
  await expect(page.getByTestId("shortlist-2027-Q1").locator("[data-testid='window']").first()).toBeVisible();
  await page.getByTestId("nav-portfolio").click();
  await expect(page.getByTestId("row-northgate-industrial")).toBeVisible();
  await page.getByTestId("nav-calendar").click();
  await expect(page.getByTestId("cal-proposed")).toContainText("waiting on others");
});

test("Step 1 Change control sets a two-quarter window that spans years", async ({ page }) => {
  await signIn(page);
  await page.getByTestId("row-action-ait-worldwide-logistics").click();
  await page.getByTestId("looking-for-change").click();
  await expect(page.locator("select")).toHaveCount(0);
  await page.getByTestId("window-start").click();
  await page.getByTestId("window-start-opt-2026-Q4").click();
  await page.getByTestId("window-count").click();
  await page.getByTestId("window-count-opt-2").click();
  await page.getByTestId("window-hours").click();
  await page.getByTestId("window-hours-opt-3").click();
  await page.getByTestId("window-save").click();
  await expect(page.getByTestId("looking-for")).toContainText("Two 3-hour blocks, Q4 2026 to Q1 2027");
  await expect(page.getByTestId("quarter-strip").locator("[data-testid^='quarter-']")).toHaveCount(2);
  await expect(page.getByTestId("quarter-2026-Q4")).toContainText("Q4 '26");
  await page.getByTestId("primary-action").click();
  await expect(page.getByTestId("shortlist-2026-Q4").locator("[data-testid='window']").first()).toContainText("to");
  await expect(page.getByTestId("shortlist-2027-Q1").locator("[data-testid='window']").first()).toBeVisible();
  await page.getByTestId("nav-portfolio").click();
  await expect(page.getByTestId("count-confirmed")).toHaveText("4 of 18");
});
