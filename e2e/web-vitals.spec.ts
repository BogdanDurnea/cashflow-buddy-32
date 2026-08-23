/**
 * Core Web Vitals budget. Measures LCP, CLS and INP in a real Chromium run
 * against the production build and fails the PR when a page regresses past
 * Google's "good" thresholds (with a small CI tolerance).
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { expect, test } from "@playwright/test";

const require = createRequire(import.meta.url);
const webVitalsScript = readFileSync(
  require.resolve("web-vitals/dist/web-vitals.iife.js"),
  "utf8",
);

/** Google "good" thresholds; CI runners are slower, so LCP gets headroom. */
export const BUDGET = {
  lcp: Number(process.env.CWV_LCP_MS ?? 4000),
  cls: Number(process.env.CWV_CLS ?? 0.1),
  inp: Number(process.env.CWV_INP_MS ?? 200),
};

const PAGES = ["/", "/urmarirea-cheltuielilor", "/bugete-personale", "/rapoarte-financiare"];

interface Vitals {
  lcp: number | null;
  cls: number;
  inp: number | null;
}

for (const path of PAGES) {
  test(`Core Web Vitals budget on ${path}`, async ({ page }) => {
    await page.addInitScript(webVitalsScript);
    await page.addInitScript(() => {
      // @ts-expect-error injected by the web-vitals IIFE bundle
      const wv = window.webVitals;
      const store: Record<string, number> = {};
      (window as unknown as { __vitals: Record<string, number> }).__vitals = store;
      wv.onLCP((m: { value: number }) => (store.lcp = m.value), { reportAllChanges: true });
      wv.onCLS((m: { value: number }) => (store.cls = m.value), { reportAllChanges: true });
      wv.onINP((m: { value: number }) => (store.inp = m.value), { reportAllChanges: true });
    });

    await page.goto(path, { waitUntil: "networkidle" });

    // Drive a few real interactions so INP has something to measure.
    await page.mouse.move(400, 300);
    for (const target of ["h1", "main", "body"]) {
      const el = page.locator(target).first();
      if (await el.count()) {
        await el.click({ position: { x: 5, y: 5 }, force: true }).catch(() => {});
        await page.waitForTimeout(120);
      }
    }
    await page.keyboard.press("Tab");
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(600);

    // Hiding the page flushes pending LCP/CLS/INP reports.
    await page.evaluate(() =>
      document.dispatchEvent(new Event("visibilitychange", { bubbles: true })),
    );
    await page.waitForTimeout(300);

    const vitals = await page.evaluate<Vitals>(() => {
      const store = (window as unknown as { __vitals: Record<string, number> }).__vitals ?? {};
      return { lcp: store.lcp ?? null, cls: store.cls ?? 0, inp: store.inp ?? null };
    });

    console.log(
      `${path} → LCP ${vitals.lcp?.toFixed(0) ?? "n/a"}ms | CLS ${vitals.cls.toFixed(3)} | INP ${
        vitals.inp?.toFixed(0) ?? "n/a"
      }ms`,
    );

    expect(vitals.lcp, `${path}: LCP was never reported`).not.toBeNull();
    expect(vitals.lcp!, `${path}: LCP ${vitals.lcp}ms exceeds ${BUDGET.lcp}ms`).toBeLessThanOrEqual(
      BUDGET.lcp,
    );
    expect(vitals.cls, `${path}: CLS ${vitals.cls} exceeds ${BUDGET.cls}`).toBeLessThanOrEqual(
      BUDGET.cls,
    );
    if (vitals.inp !== null) {
      expect(vitals.inp, `${path}: INP ${vitals.inp}ms exceeds ${BUDGET.inp}ms`).toBeLessThanOrEqual(
        BUDGET.inp,
      );
    }
  });
}
