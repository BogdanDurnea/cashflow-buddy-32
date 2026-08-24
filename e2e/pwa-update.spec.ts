import { test, expect } from "@playwright/test";

/**
 * PWA update flow smoke test.
 *
 * A real service-worker version bump can't be produced reliably in CI, so we
 * drive the exact same code path the registration uses: `watchForUpdates`
 * dispatches a `pwa:update-available` event when a new worker finishes
 * installing while an old one still controls the page.
 */

const UPDATE_EVENT = "pwa:update-available";

test.describe("PWA update", () => {
  test("no update banner on a fresh load", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("pwa-update-prompt")).toHaveCount(0);
  });

  test("shows 'Actualizează aplicația' after the service worker updates", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#root")).not.toBeEmpty();

    // Simulate a new worker finishing install: the waiting worker records
    // whatever message the UI posts to it.
    await page.evaluate((eventName) => {
      const w = window as unknown as { __swMessages: unknown[] };
      w.__swMessages = [];
      const waiting = {
        state: "installed",
        postMessage: (message: unknown) => w.__swMessages.push(message),
      };
      window.dispatchEvent(new CustomEvent(eventName, { detail: { waiting } }));
    }, UPDATE_EVENT);

    const banner = page.getByTestId("pwa-update-prompt");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/versiune nouă este disponibilă/i);

    const updateButton = page.getByRole("button", { name: /Actualizează aplicația/i });
    await expect(updateButton).toBeVisible();

    // Clicking must tell the waiting worker to activate and then reload.
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      updateButton.click(),
    ]);

    // After the reload the banner is gone again (new version is live).
    await expect(page.getByTestId("pwa-update-prompt")).toHaveCount(0);
  });

  test("posts SKIP_WAITING to the waiting worker", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#root")).not.toBeEmpty();

    // The mock worker persists the message so it survives the reload.
    await page.evaluate((eventName) => {
      const waiting = {
        state: "installed",
        postMessage: (message: unknown) =>
          sessionStorage.setItem("__swMessage", JSON.stringify(message)),
      };
      window.dispatchEvent(new CustomEvent(eventName, { detail: { waiting } }));
    }, UPDATE_EVENT);

    await page.getByRole("button", { name: /Actualizează aplicația/i }).click();

    await expect
      .poll(() => page.evaluate(() => sessionStorage.getItem("__swMessage")))
      .toBe(JSON.stringify({ type: "SKIP_WAITING" }));
  });
});
