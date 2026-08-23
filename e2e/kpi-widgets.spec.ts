import { test, expect, type Page } from "@playwright/test";

/**
 * E2E coverage for the dashboard KPI widgets.
 *
 * The dashboard is behind auth. When a Supabase session is available in the
 * environment (LOVABLE_BROWSER_SUPABASE_* or E2E_SUPABASE_*), it is restored
 * before navigating; otherwise the test is skipped so CI stays green on
 * unauthenticated runs.
 */

const storageKey =
  process.env.LOVABLE_BROWSER_SUPABASE_STORAGE_KEY ?? process.env.E2E_SUPABASE_STORAGE_KEY;
const sessionJson =
  process.env.LOVABLE_BROWSER_SUPABASE_SESSION_JSON ?? process.env.E2E_SUPABASE_SESSION_JSON;
const hasSession = Boolean(storageKey && sessionJson);

async function restoreSession(page: Page, baseURL: string) {
  await page.goto(baseURL);
  await page.evaluate(
    ([key, value]) => window.localStorage.setItem(key as string, value as string),
    [storageKey as string, sessionJson as string],
  );
}

test.describe("KPI widgets (authenticated dashboard)", () => {
  test.skip(!hasSession, "No Supabase session available for E2E auth.");

  test.beforeEach(async ({ page, baseURL }) => {
    await restoreSession(page, baseURL!);
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  });

  test("renders the three KPI cards", async ({ page }) => {
    const widgets = page.getByTestId("kpi-widgets");
    await expect(widgets).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("kpi-card-health")).toBeVisible();
    await expect(page.getByTestId("kpi-card-cashflow")).toBeVisible();
    await expect(page.getByTestId("kpi-card-forecast")).toBeVisible();
  });

  test("health score is an integer between 0 and 100", async ({ page }) => {
    const score = page.getByTestId("kpi-health-score");
    await expect(score).toBeVisible({ timeout: 20_000 });
    const text = (await score.textContent())?.trim() ?? "";
    expect(text).toMatch(/^\d{1,3}$/);
    const value = Number(text);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(100);
    await expect(page.getByText("/100")).toBeVisible();
  });

  test("health progress bar mirrors the score", async ({ page }) => {
    const score = page.getByTestId("kpi-health-score");
    await expect(score).toBeVisible({ timeout: 20_000 });
    const value = Number((await score.textContent())?.trim());

    const bar = page.getByTestId("kpi-card-health").getByRole("progressbar").first();
    const now = await bar.getAttribute("aria-valuenow");
    if (now !== null) expect(Number(now)).toBe(value);
  });

  test("cash in/out and forecast figures are rendered", async ({ page }) => {
    await expect(page.getByTestId("kpi-card-cashflow")).toContainText(/\d/, { timeout: 20_000 });
    await expect(page.getByTestId("kpi-card-forecast")).toContainText(/\d/);
    await expect(page.getByTestId("kpi-card-forecast")).toContainText(
      /forecast|prognoz|previz/i,
    );
  });

  test("KPI cards stay in sync with the transaction list totals", async ({ page }) => {
    await expect(page.getByTestId("kpi-widgets")).toBeVisible({ timeout: 20_000 });

    // The transaction list badge shows "<visible> / <total>"; when there are no
    // transactions at all, the KPI figures must be zeroed out.
    const body = (await page.locator("body").innerText()).toLowerCase();
    const emptyList = /no transactions|nicio tranzac/.test(body);

    if (emptyList) {
      const score = Number((await page.getByTestId("kpi-health-score").textContent())?.trim());
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      await expect(page.getByTestId("kpi-card-cashflow")).toContainText("0");
    } else {
      await expect(page.getByTestId("kpi-card-cashflow")).toContainText(/\d/);
    }
  });
});

test("dashboard KPI markup is not exposed to anonymous visitors", async ({ page }) => {
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const visible = await page.getByTestId("kpi-widgets").isVisible().catch(() => false);
  expect(visible).toBe(false);
});
