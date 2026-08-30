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

  test("shows 'Actualizează aplicația' and the current/new versions after the service worker updates", async ({ page }) => {
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
      window.dispatchEvent(
        new CustomEvent(eventName, {
          detail: { waiting, currentVersion: "1.0.0", newVersion: "1.1.0" },
        }),
      );
    }, UPDATE_EVENT);

    const banner = page.getByTestId("pwa-update-prompt");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/versiune nouă este disponibilă/i);
    await expect(banner).toContainText(/Versiunea curentă: 1\.0\.0 → Versiunea nouă: 1\.1\.0/i);

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
      window.dispatchEvent(
        new CustomEvent(eventName, {
          detail: { waiting, currentVersion: "1.0.0", newVersion: "1.1.0" },
        }),
      );
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
      const versions = [
        { key: "v1", current: "1.0.0", next: "1.0.1" },
        { key: "v2", current: "1.0.0", next: "1.1.0" },
      ];
      for (const { key, current, next } of versions) {
        const waiting = {
          state: "installed",
          postMessage: (message: unknown) => {
            w.__swMessages[key].push(message);
            sessionStorage.setItem("__swTarget", key);
          },
        };
        window.dispatchEvent(
          new CustomEvent(eventName, {
            detail: { waiting, currentVersion: current, newVersion: next },
          }),
        );
      }
    }, UPDATE_EVENT);

    // Exactly one banner, never stacked.
    await expect(page.getByTestId("pwa-update-prompt")).toHaveCount(1);
    const banner = page.getByTestId("pwa-update-prompt");
    await expect(banner).toContainText(/Versiunea curentă: 1\.0\.0 → Versiunea nouă: 1\.1\.0/i);

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
      const make = (key: "v1" | "v2", current: string, next: string) => ({
        state: "installed",
        postMessage: () => {
          calls[key] += 1;
        },
        __version: { current, next },
      });
      window.dispatchEvent(
        new CustomEvent(eventName, {
          detail: { waiting: make("v1", "1.0.0", "1.0.1"), currentVersion: "1.0.0", newVersion: "1.0.1" },
        }),
      );
      window.dispatchEvent(
        new CustomEvent(eventName, {
          detail: { waiting: make("v2", "1.0.0", "1.1.0"), currentVersion: "1.0.0", newVersion: "1.1.0" },
        }),
      );

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

test.describe("PWA update – three consecutive updates", () => {
  test("shows a single banner and targets only the newest of three waiting workers", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#root")).not.toBeEmpty();

    // Three updates arrive back to back (v1, v2, v3).
    await page.evaluate((eventName) => {
      const w = window as unknown as { __swMessages: Record<string, unknown[]> };
      w.__swMessages = { v1: [], v2: [], v3: [] };
      const versions = [
        { key: "v1", current: "1.0.0", next: "1.0.1" },
        { key: "v2", current: "1.0.0", next: "1.1.0" },
        { key: "v3", current: "1.0.0", next: "1.2.0" },
      ];
      for (const { key, current, next } of versions) {
        const waiting = {
          state: "installed",
          postMessage: (message: unknown) => {
            w.__swMessages[key].push(message);
            sessionStorage.setItem("__swTarget", key);
          },
        };
        window.dispatchEvent(
          new CustomEvent(eventName, {
            detail: { waiting, currentVersion: current, newVersion: next },
          }),
        );
      }
    }, UPDATE_EVENT);

    // Exactly one banner, never stacked.
    await expect(page.getByTestId("pwa-update-prompt")).toHaveCount(1);
    const banner = page.getByTestId("pwa-update-prompt");
    await expect(banner).toContainText(/Versiunea curentă: 1\.0\.0 → Versiunea nouă: 1\.2\.0/i);

    const updateButton = page.getByRole("button", { name: /Actualizează aplicația/i });
    await expect(updateButton).toHaveCount(1);

    await updateButton.click();

    // Only the newest worker (v3) receives SKIP_WAITING, exactly once.
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("__swTarget"))).toBe("v3");
  });

  test("does not send SKIP_WAITING to superseded workers after three updates", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#root")).not.toBeEmpty();

    const counts = await page.evaluate(async (eventName) => {
      const calls = { v1: 0, v2: 0, v3: 0 };
      const make = (key: "v1" | "v2" | "v3", current: string, next: string) => ({
        state: "installed",
        postMessage: () => {
          calls[key] += 1;
        },
        __version: { current, next },
      });
      window.dispatchEvent(
        new CustomEvent(eventName, {
          detail: { waiting: make("v1", "1.0.0", "1.0.1"), currentVersion: "1.0.0", newVersion: "1.0.1" },
        }),
      );
      window.dispatchEvent(
        new CustomEvent(eventName, {
          detail: { waiting: make("v2", "1.0.0", "1.1.0"), currentVersion: "1.0.0", newVersion: "1.1.0" },
        }),
      );
      window.dispatchEvent(
        new CustomEvent(eventName, {
          detail: { waiting: make("v3", "1.0.0", "1.2.0"), currentVersion: "1.0.0", newVersion: "1.2.0" },
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 100));
      const button = [...document.querySelectorAll("button")].find((b) =>
        /Actualizează aplicația/i.test(b.textContent ?? ""),
      );
      button?.click();
      await new Promise((resolve) => setTimeout(resolve, 50));
      return calls;
    }, UPDATE_EVENT);

    expect(counts).toEqual({ v1: 0, v2: 0, v3: 1 });
  });
test("'Mai târziu' persists per version across a refresh", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#root")).not.toBeEmpty();

    const fire = (newVersion: string) =>
      page.evaluate(
        ([eventName, version]) => {
          window.dispatchEvent(
            new CustomEvent(eventName as string, {
              detail: {
                waiting: { state: "installed", postMessage: () => {} },
                currentVersion: "1.0.0",
                newVersion: version,
              },
            }),
          );
        },
        [UPDATE_EVENT, newVersion],
      );

    await fire("1.1.0");
    const banner = page.getByTestId("pwa-update-prompt");
    await expect(banner).toBeVisible();

    await page.getByTestId("pwa-update-dismiss").click();
    await expect(banner).toHaveCount(0);

    // Same version offered again in the same session: stays hidden.
    await fire("1.1.0");
    await expect(page.getByTestId("pwa-update-prompt")).toHaveCount(0);

    // After a refresh the dismissal is still remembered for that version.
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("#root")).not.toBeEmpty();
    await fire("1.1.0");
    await expect(page.getByTestId("pwa-update-prompt")).toHaveCount(0);
  });

  test("banner reappears only for a genuinely newer version", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#root")).not.toBeEmpty();

    await page.evaluate(
      ([eventName, version]) => {
        localStorage.setItem("pwa:update-dismissed-version", "1.1.0");
        window.dispatchEvent(
          new CustomEvent(eventName as string, {
            detail: {
              waiting: { state: "installed", postMessage: () => {} },
              currentVersion: "1.0.0",
              newVersion: version,
            },
          }),
        );
      },
      [UPDATE_EVENT, "1.1.0"],
    );
    await expect(page.getByTestId("pwa-update-prompt")).toHaveCount(0);

    await page.evaluate(
      ([eventName, version]) => {
        window.dispatchEvent(
          new CustomEvent(eventName as string, {
            detail: {
              waiting: { state: "installed", postMessage: () => {} },
              currentVersion: "1.0.0",
              newVersion: version,
            },
          }),
        );
      },
      [UPDATE_EVENT, "1.2.0"],
    );

    const banner = page.getByTestId("pwa-update-prompt");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/Versiunea nouă: 1\.2\.0/i);
  });

  test("'Resetează opțiunea' re-shows a dismissed banner", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#root")).not.toBeEmpty();

    await page.evaluate(
      ([eventName, version]) => {
        localStorage.setItem("pwa:update-dismissed-version", version);
        window.dispatchEvent(
          new CustomEvent(eventName as string, {
            detail: {
              waiting: { state: "installed", postMessage: () => {} },
              currentVersion: "1.0.0",
              newVersion: version,
            },
          }),
        );
      },
      [UPDATE_EVENT, "1.1.0"],
    );

    // Dismissed banner is hidden, but the reset control appears.
    await expect(page.getByTestId("pwa-update-prompt")).toHaveCount(0);
    const reset = page.getByTestId("pwa-update-reset");
    await expect(reset).toBeVisible();
    await expect(reset).toContainText("1.1.0");

    await page.getByTestId("pwa-update-reset-button").click();

    // The full update banner returns and the reset control disappears.
    const banner = page.getByTestId("pwa-update-prompt");
    await expect(banner).toBeVisible();
    await expect(page.getByTestId("pwa-update-reset")).toHaveCount(0);
  });
});
