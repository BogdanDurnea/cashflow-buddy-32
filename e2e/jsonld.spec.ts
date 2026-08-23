/**
 * Validates the JSON-LD that actually reaches the browser (post-hydration),
 * so markup drift between the React source and the rendered output is caught.
 */
import { expect, test } from "@playwright/test";
import { SITE_URL } from "../src/data/seoRoutes";
import { validateJsonLdNode } from "../src/lib/seo/validateJsonLd";
import { guides } from "../src/data/guides";

async function readJsonLd(page: import("@playwright/test").Page) {
  const raw = await page.locator('head script[type="application/ld+json"]').allTextContents();
  return raw.map((text) => {
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch (error) {
      throw new Error(`Invalid JSON-LD payload in rendered HTML: ${(error as Error).message}`);
    }
  });
}

for (const guide of guides) {
  test.describe(`JSON-LD on ${guide.to}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(guide.to, { waitUntil: "networkidle" });
      await expect(page.locator('head script[type="application/ld+json"]').first()).toHaveCount(1);
    });

    test("emits schema-valid FAQPage and BreadcrumbList", async ({ page }) => {
      const nodes = await readJsonLd(page);
      const types = nodes.map((n) => n["@type"]);
      expect(types).toContain("FAQPage");
      expect(types).toContain("BreadcrumbList");

      const errors = nodes.flatMap((node, i) =>
        validateJsonLdNode(node, `${guide.to} script[${i}]`),
      );
      expect(errors, `JSON-LD errors on ${guide.to}:\n${errors.join("\n")}`).toEqual([]);
    });

    test("every FAQ answer in the markup is visible on the page", async ({ page }) => {
      const nodes = await readJsonLd(page);
      const faq = nodes.find((n) => n["@type"] === "FAQPage");
      const questions = (faq?.mainEntity as Array<Record<string, unknown>>) ?? [];
      expect(questions.length).toBeGreaterThan(1);

      const body = (await page.locator("main").innerText()).replace(/\s+/g, " ");
      for (const q of questions) {
        expect(body).toContain(String(q.name));
        const answer = (q.acceptedAnswer as Record<string, unknown>).text as string;
        expect(body).toContain(answer.slice(0, 60));
      }
    });

    test("breadcrumb items point at real, reachable URLs", async ({ page, request }) => {
      const nodes = await readJsonLd(page);
      const crumbs =
        (nodes.find((n) => n["@type"] === "BreadcrumbList")?.itemListElement as Array<
          Record<string, unknown>
        >) ?? [];
      expect(crumbs.length).toBeGreaterThanOrEqual(2);

      for (const crumb of crumbs) {
        const item = String(crumb.item);
        expect(item.startsWith(SITE_URL)).toBe(true);
        const path = new URL(item).pathname;
        const response = await request.get(path);
        expect(response.status(), `${path} is not reachable`).toBeLessThan(400);
      }
    });
  });
}

test("non-guide pages do not leak stale structured data", async ({ page }) => {
  await page.goto("/install", { waitUntil: "networkidle" });
  const leftovers = await page.locator('head script[data-seo-jsonld="true"]').count();
  expect(leftovers).toBe(0);
});
