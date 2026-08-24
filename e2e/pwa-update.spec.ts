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

test.describe("PWA update – two consecutive updates", () => {
  test("shows a single banner and targets only the newest waiting worker", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#root")).not.toBeEmpty();

    // Two updates arrive back to back (v1 then v2).
    await page.evaluate((eventName) => {
      const w = window as unknown as { __swMessages: Record<string, unknown[]> };
      w.__swMessages = { v1: [], v2: [] };
      for (const version of ["v1", "v2"]) {
        const waiting = {
          state: "installed",
          postMessage: (message: unknown) => {
            w.__swMessages[version].push(message);
            sessionStorage.setItem("__swTarget", version);
          },
        };
        window.dispatchEvent(new CustomEvent(eventName, { detail: { waiting } }));
      }
    }, UPDATE_EVENT);

    // Exactly one banner, never stacked.
    await expect(page.getByTestId("pwa-update-prompt")).toHaveCount(1);
    const updateButton = page.getByRole("button", { name: /Actualizează aplicația/i });
    await expect(updateButton).toHaveCount(1);

    await updateButton.click();

    // Only the newest worker receives SKIP_WAITING, exactly once.
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("__swTarget"))).toBe("v2");
  });

  test("does not duplicate the SKIP_WAITING message for the older worker", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#root")).not.toBeEmpty();

    const counts = await page.evaluate(async (eventName) => {
      const calls = { v1: 0, v2: 0 };
      const make = (key: "v1" | "v2") => ({
        state: "installed",
        postMessage: () => {
          calls[key] += 1;
        },
      });
      window.dispatchEvent(new CustomEvent(eventName, { detail: { waiting: make("v1") } }));
      window.dispatchEvent(new CustomEvent(eventName, { detail: { waiting: make("v2") } }));

      await new Promise((resolve) => setTimeout(resolve, 100));
      const button = [...document.querySelectorAll("button")].find((b) =>
        /Actualizează aplicația/i.test(b.textContent ?? ""),
      );
      button?.click();
      await new Promise((resolve) => setTimeout(resolve, 50));
      return calls;
    }, UPDATE_EVENT);

    expect(counts).toEqual({ v1: 0, v2: 1 });
  });
});
