import { test, expect, devices } from "@playwright/test";

/**
 * PWA install flow smoke test.
 *
 * Headless Chromium never fires a real `beforeinstallprompt`, so we verify the
 * two halves of the flow separately:
 *  1. the manifest the browser needs in order to fire the event is served and valid;
 *  2. the /install page reacts to a `beforeinstallprompt` event by rendering the
 *     "Instalează acum" button and calling prompt() on click.
 */

test.describe("PWA install", () => {
  test("serves a valid web app manifest", async ({ page, baseURL }) => {
    await page.goto("/install", { waitUntil: "domcontentloaded" });

    const href = await page.getAttribute('link[rel="manifest"]', "href");
    expect(href, "index.html must declare a manifest link").toBeTruthy();

    const response = await page.request.get(new URL(href!, baseURL).toString());
    expect(response.status(), "manifest must be resolvable").toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBe("standalone");

    const sizes = (manifest.icons ?? []).map((icon: { sizes?: string }) => icon.sizes);
    expect(sizes, "manifest needs a 192px icon").toContain("192x192");
    expect(sizes, "manifest needs a 512px icon").toContain("512x512");

    // Every declared icon must actually exist.
    for (const icon of manifest.icons ?? []) {
      const iconResponse = await page.request.get(new URL(icon.src, baseURL).toString());
      expect(iconResponse.status(), `icon ${icon.src} must be reachable`).toBe(200);
    }
  });

  test("shows 'Instalează acum' when beforeinstallprompt fires", async ({ page }) => {
    await page.goto("/install", { waitUntil: "domcontentloaded" });

    // Instructions fallback is shown until the browser offers an install prompt.
    const installButton = page.getByRole("button", { name: /Instalează acum/i });
    await expect(page.getByRole("heading", { name: /Instalează CashFlow Buddy/i })).toBeVisible();
    await expect(installButton).toHaveCount(0);

    // Simulate the Chromium install prompt.
    await page.evaluate(() => {
      const event = new Event("beforeinstallprompt", { cancelable: true }) as Event & {
        prompt: () => void;
        userChoice: Promise<{ outcome: string; platform: string }>;
      };
      (window as unknown as { __promptCalls: number }).__promptCalls = 0;
      event.prompt = () => {
        (window as unknown as { __promptCalls: number }).__promptCalls += 1;
      };
      event.userChoice = Promise.resolve({ outcome: "accepted", platform: "web" });
      window.dispatchEvent(event);
    });

    await expect(installButton).toBeVisible();

    await installButton.click();

    // prompt() was invoked and the accepted outcome flips the page to installed state.
    await expect
      .poll(async () => page.evaluate(() => (window as unknown as { __promptCalls: number }).__promptCalls))
      .toBe(1);
    await expect(page.getByText(/Aplicația este instalată/i)).toBeVisible();
  });
});
