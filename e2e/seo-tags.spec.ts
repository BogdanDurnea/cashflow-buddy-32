/**
 * End-to-end SEO checks against the rendered HTML of the production build.
 * Catches discrepancies between what the source claims and what a crawler
 * actually receives after React hydration.
 */
import { expect, test } from "@playwright/test";
import { SITE_URL, indexableRoutes, ogImageFor } from "../src/data/seoRoutes";

const BRAND = "CashFlow Buddy";

const content = async (page: import("@playwright/test").Page, selector: string) => {
  const locator = page.locator(`head ${selector}`).first();
  // Absent tags (e.g. no robots meta on indexable pages) resolve to null
  // instead of hanging on the auto-waiting locator.
  return (await locator.count()) ? locator.getAttribute("content") : null;
};

for (const route of indexableRoutes()) {
  test.describe(`route ${route.path}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(route.path, { waitUntil: "networkidle" });
      // Wait until useSEO has replaced the static head tags from index.html.
      await expect
        .poll(async () =>
          new URL(
            (await page.locator('head link[rel="canonical"]').first().getAttribute("href")) ?? "/",
            SITE_URL,
          ).pathname.replace(/\/+$/, ""),
        )
        .toBe(route.path.replace(/\/+$/, ""));
    });


    test("has a unique, branded title and a valid description", async ({ page }) => {
      const title = await page.title();
      expect(title).toContain(BRAND);
      expect(title.length).toBeGreaterThan(15);
      expect(title.length).toBeLessThanOrEqual(75);

      const description = await content(page, 'meta[name="description"]');
      expect(description, "meta description is missing").toBeTruthy();
      expect(description!.length).toBeGreaterThan(50);
      expect(description!.length).toBeLessThanOrEqual(170);
    });

    test("has exactly one self-referential canonical", async ({ page }) => {
      const canonicals = page.locator('head link[rel="canonical"]');
      await expect(canonicals).toHaveCount(1);

      const expected = `${SITE_URL}${route.path === "/" ? "/" : route.path}`;
      const normalize = (u: string) => new URL(u, SITE_URL).pathname.replace(/\/+$/, "") || "/";

      // useSEO rewrites the static canonical after hydration; poll so the
      // assertion reflects the settled value, not the index.html placeholder.
      await expect
        .poll(async () => normalize((await canonicals.first().getAttribute("href")) ?? "/"))
        .toBe(normalize(expected));

      const href = await canonicals.first().getAttribute("href");
      expect(href).toBeTruthy();
      expect(href).not.toContain("?");
      expect(href).not.toContain("#");
    });


    test("og:url mirrors the canonical and OG mirrors the primary tags", async ({ page }) => {
      const canonical = await page
        .locator('head link[rel="canonical"]')
        .first()
        .getAttribute("href");
      expect(await content(page, 'meta[property="og:url"]')).toBe(canonical);
      expect(await content(page, 'meta[property="og:title"]')).toBe(await page.title());
      expect(await content(page, 'meta[property="og:description"]')).toBe(
        await content(page, 'meta[name="description"]'),
      );
    });

    test("serves the expected social image at 1200x630", async ({ page, request }) => {
      const expectedImage = ogImageFor(route.path).url;
      const ogImage = await content(page, 'meta[property="og:image"]');
      expect(ogImage).toBe(expectedImage);
      expect(await content(page, 'meta[name="twitter:image"]')).toBe(ogImage);
      expect(await content(page, 'meta[name="twitter:card"]')).toBe("summary_large_image");
      expect(await content(page, 'meta[property="og:image:width"]')).toBe("1200");
      expect(await content(page, 'meta[property="og:image:height"]')).toBe("630");

      const response = await request.get(new URL(expectedImage).pathname);
      expect(response.status(), `${expectedImage} is not served`).toBe(200);
    });

    test("is indexable and has exactly one h1", async ({ page }) => {
      const robots = await content(page, 'meta[name="robots"]');
      expect(robots ?? "").not.toContain("noindex");

      const h1 = page.locator("h1");
      await expect(h1).toHaveCount(1);
      expect((await h1.first().innerText()).trim().length).toBeGreaterThan(3);
    });
  });
}

test.describe("private routes", () => {
  test("/reset-password is noindex", async ({ page }) => {
    await page.goto("/reset-password", { waitUntil: "networkidle" });
    expect(await content(page, 'meta[name="robots"]')).toContain("noindex");
  });

  test("unknown routes are noindex", async ({ page }) => {
    await page.goto("/aceasta-pagina-nu-exista", { waitUntil: "networkidle" });
    expect(await content(page, 'meta[name="robots"]')).toContain("noindex");
  });
});

test.describe("crawl files", () => {
  test("robots.txt and sitemap.xml are served", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain("Sitemap:");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    const xml = await sitemap.text();
    for (const route of indexableRoutes()) {
      expect(xml).toContain(`${SITE_URL}${route.path === "/" ? "/" : route.path}`);
    }
  });
});
