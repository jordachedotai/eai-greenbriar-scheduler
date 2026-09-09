// The full demo walkthrough in mock mode, per docs/DEMO_SCRIPT.md.
// One portco through all six stages using only on-screen buttons and the
// presenter menu. Fails on any console error.

import { expect, test, type Page } from "@playwright/test";

async function waitForAgent(page: Page) {
  // The working indicator appears for 1.2 to 2.5 seconds in mock mode.
  await page.waitForSelector('[data-testid="working"]', { state: "detached", timeout: 15_000 });
}

test("one portco, setup to locked", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Fresh board: five in Setup, 0 of 20 locked.
  await expect(page.getByTestId("column-count-0")).toHaveText("5");
  await expect(page.getByTestId("metric-meetings-locked")).toHaveText("0 of 20");

  // Beat 2: availability.
  await page.getByTestId("card-pc1").click();
  await expect(page.getByTestId("portco-drawer")).toBeVisible();
  await expect(page.getByTestId("stage-button")).toHaveText("Pull availability");
  await page.getByTestId("stage-button").click();
  await expect(page.getByTestId("stage-panel")).toHaveAttribute("data-stage", "1");
  await expect(page.getByTestId("thin-Q3")).toContainText("Only 2 windows found in Q3");
  await expect(page.getByTestId("grid-Q1").locator('[data-testid="window"]').first()).toContainText("calendar");
  await expect(page.getByTestId("column-count-1")).toHaveText("1");

  // Beat 3: shortlist and one-pager.
  await page.getByTestId("stage-button").click(); // Build shortlist
  await expect(page.getByTestId("stage-panel")).toHaveAttribute("data-stage", "2");
  await waitForAgent(page);
  const onepager = page.getByTestId("draft-onepager");
  await expect(onepager.getByTestId("draft-text")).toContainText("Dear Karen");
  await expect(onepager.getByTestId("draft-text")).not.toContainText("{{");
  await expect(page.getByTestId("shortlist-Q1").locator('[data-testid="window"]')).toHaveCount(3);
  await expect(page.getByTestId("shortlist-Q3").locator('[data-testid="window"]')).toHaveCount(2);
  await onepager.getByTestId("draft-approve").click(); // Send for internal approval
  await expect(page.getByTestId("stage-panel")).toHaveAttribute("data-stage", "3");
  await expect(page.getByTestId("column-count-3")).toHaveText("1");

  // Beat 4: internal approval and the portco.
  await expect(page.getByTestId("stage-button")).toBeDisabled();
  await page.keyboard.press("Shift+P");
  await expect(page.getByTestId("presenter-menu")).toBeVisible();
  await page.getByTestId("sim-approvals").click();
  await expect(page.getByTestId("approved-p1")).toBeVisible();
  await expect(page.getByTestId("stage-button")).toBeEnabled();
  await page.getByTestId("stage-button").click(); // Send to portco
  await expect(page.getByTestId("stage-panel")).toHaveAttribute("data-stage", "4");
  await waitForAgent(page);
  const portcoEmail = page.getByTestId("draft-portco-email");
  await expect(portcoEmail.getByTestId("draft-text")).toContainText("Subject:");
  await expect(page.getByTestId("stage-button")).toBeDisabled();
  await portcoEmail.getByTestId("draft-approve").click(); // Approve and send
  await expect(portcoEmail.getByTestId("draft-approved")).toHaveText("Sent");
  await page.getByTestId("sim-portco-reply").click();
  await expect(page.getByTestId("portco-picks")).toContainText("option 1");
  await expect(page.getByTestId("quarter-Q1")).not.toContainText("No dates yet");

  // Beat 5: the board, with a conflict.
  await page.getByTestId("stage-button").click(); // Send to board
  await expect(page.getByTestId("stage-panel")).toHaveAttribute("data-stage", "5");
  await waitForAgent(page);
  const boardEmail = page.getByTestId("draft-board-email");
  await expect(boardEmail.getByTestId("draft-text")).toContainText("Subject:");
  await boardEmail.getByTestId("draft-approve").click();
  await expect(boardEmail.getByTestId("draft-approved")).toHaveText("Sent");
  await expect(page.getByTestId("board-matrix")).toBeVisible();
  await page.getByTestId("sim-board-conflict").click();
  await expect(page.getByTestId("conflict-Q3")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("resp-Q3-b2")).toHaveAttribute("data-response", "declined");
  await expect(page.getByTestId("reverify")).toContainText("All partners still free");
  await expect(page.getByTestId("conflict-note")).toContainText("rank 2");
  await expect(page.getByTestId("stage-button")).toBeDisabled();
  await page.getByTestId("draft-conflict").getByTestId("draft-approve").click(); // Approve re-send
  await expect(page.getByTestId("resp-Q3-b2")).toHaveAttribute("data-response", "pending");
  await page.getByTestId("sim-board-confirm").click();
  await expect(page.getByTestId("resp-Q3-b2")).toHaveAttribute("data-response", "confirmed");
  await expect(page.getByTestId("stage-button")).toBeEnabled();

  // Beat 6: lock and logistics.
  await page.getByTestId("stage-button").click(); // Lock and plan logistics
  await expect(page.getByTestId("stage-panel")).toHaveAttribute("data-stage", "6");
  await waitForAgent(page);
  await expect(page.getByTestId("logistics-Q1")).toContainText("miles from the office");
  await expect(page.getByTestId("metric-meetings-locked")).toHaveText("0 of 20");
  await page.getByTestId("stage-button").click(); // Approve logistics
  await expect(page.getByTestId("metric-meetings-locked")).toHaveText("4 of 20");
  await expect(page.getByTestId("column-count-6")).toHaveText("1");
  await expect(page.getByTestId("quarter-Q3").locator("[data-final='true']")).toHaveCount(1);
  await expect(page.getByTestId("timeline").locator("li")).toHaveCount(await page.getByTestId("timeline").locator("li").count());

  // Reload: state persists.
  await page.reload();
  await expect(page.getByTestId("metric-meetings-locked")).toHaveText("4 of 20");

  expect(errors, errors.join("\n")).toEqual([]);
});

test("jump ahead to the board beat and finish", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByTestId("card-pc1")).toBeVisible();

  await page.keyboard.press("Shift+P");
  await page.getByTestId("jump-state").selectOption("one-portco-at-board");
  await expect(page.getByTestId("column-count-4")).toHaveText("1");
  await page.getByTestId("card-pc1").click();
  await expect(page.getByTestId("stage-panel")).toHaveAttribute("data-stage", "4");
  await expect(page.getByTestId("portco-picks")).toContainText("option");
  await expect(page.getByTestId("draft-portco-email").getByTestId("draft-text")).not.toContainText("{{");
  await expect(page.getByTestId("stage-button")).toHaveText("Send to board");

  await page.getByTestId("stage-button").click();
  await waitForAgent(page);
  await page.getByTestId("draft-board-email").getByTestId("draft-approve").click();
  await page.getByTestId("sim-board-conflict").click();
  await expect(page.getByTestId("conflict-Q3")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("draft-conflict").getByTestId("draft-approve").click();
  await page.getByTestId("sim-board-confirm").click();
  await page.getByTestId("stage-button").click();
  await waitForAgent(page);
  await page.getByTestId("stage-button").click();
  await expect(page.getByTestId("metric-meetings-locked")).toHaveText("4 of 20");
  expect(errors).toEqual([]);
});

test("all-in-flight spreads the board", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByTestId("card-pc1")).toBeVisible();
  await page.keyboard.press("Shift+P");
  await page.getByTestId("jump-state").selectOption("all-in-flight");
  await expect(page.getByTestId("column-count-0")).toHaveText("0");
  await expect(page.getByTestId("column-count-6")).toHaveText("1");
  await expect(page.getByTestId("metric-meetings-locked")).toHaveText("4 of 20");
  await page.getByTestId("presenter-reset").click();
  await expect(page.getByTestId("column-count-0")).toHaveText("5");
  await expect(page.getByTestId("metric-meetings-locked")).toHaveText("0 of 20");
});
