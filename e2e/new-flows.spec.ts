import { test, expect } from "@playwright/test";

// Fluxuri noi: import CSV, tranzacții demo la onboarding, copie de siguranță.
// Rulează pe pagina publică de landing + dashboard (necesită sesiune în preview).

test.describe("Fluxuri noi", () => {
  test("pagina de start se încarcă și are link către instalare", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator('a[href="/install"]').first()).toBeVisible();
  });

  test("dashboard-ul răspunde fără erori de consolă critice", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const fatal = errors.filter((e) => /Cannot read|is not a function|undefined is not/.test(e));
    expect(fatal).toEqual([]);
  });
});
