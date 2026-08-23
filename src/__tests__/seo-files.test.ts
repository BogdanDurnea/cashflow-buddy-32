/**
 * Validates the static crawl files (robots.txt, sitemap.xml) against the
 * canonical route registry so a new route can never ship un-indexed and a
 * private route can never leak into the sitemap.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { SITE_URL, indexableRoutes, privateRoutes, seoRoutes } from "@/data/seoRoutes";

const robots = readFileSync(resolve("public/robots.txt"), "utf8");
const sitemap = readFileSync(resolve("public/sitemap.xml"), "utf8");

const sitemapLocs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

/** Naive but faithful robots.txt matcher for the `User-agent: *` group. */
function wildcardGroup(txt: string) {
  const lines = txt.split("\n").map((l) => l.trim());
  const start = lines.findIndex((l) => /^user-agent:\s*\*$/i.test(l));
  if (start === -1) return [] as string[];
  const rules: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^user-agent:/i.test(line)) break;
    if (/^(allow|disallow):/i.test(line)) rules.push(line);
  }
  return rules;
}

function isAllowed(path: string) {
  const rules = wildcardGroup(robots).map((r) => {
    const [type, value] = r.split(":");
    return { allow: /allow/i.test(type) && !/disallow/i.test(type), pattern: value.trim() };
  });

  let decision = true;
  let matchedLength = -1;
  for (const rule of rules) {
    const regex = new RegExp(
      "^" + rule.pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*"),
    );
    if (regex.test(path) && rule.pattern.length > matchedLength) {
      matchedLength = rule.pattern.length;
      decision = rule.allow;
    }
  }
  return decision;
}

describe("robots.txt", () => {
  it("exists and declares a wildcard user-agent group", () => {
    expect(robots).toMatch(/user-agent:\s*\*/i);
    expect(wildcardGroup(robots).length).toBeGreaterThan(0);
  });

  it("does not block the whole site", () => {
    const rules = wildcardGroup(robots);
    expect(rules.some((r) => /^disallow:\s*\/$/i.test(r))).toBe(false);
    expect(rules.some((r) => /^allow:\s*\/$/i.test(r))).toBe(true);
  });

  it.each(indexableRoutes().map((r) => r.path))("allows crawling %s", (path) => {
    expect(isAllowed(path)).toBe(true);
  });

  it.each(privateRoutes)("blocks crawling %s", (path) => {
    expect(isAllowed(path)).toBe(false);
  });

  it("points crawlers at the sitemap on the canonical domain", () => {
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });

  it("has no stray CRLF-only or duplicated sitemap directives", () => {
    const directives = robots.match(/^Sitemap:/gim) ?? [];
    expect(directives).toHaveLength(1);
  });
});

describe("sitemap.xml", () => {
  it("is a well-formed urlset", () => {
    expect(sitemap.trimStart()).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(sitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(sitemap.trimEnd().endsWith("</urlset>")).toBe(true);
  });

  it("lists every indexable route exactly once", () => {
    const expected = indexableRoutes().map((r) => `${SITE_URL}${r.path === "/" ? "/" : r.path}`);
    expect([...sitemapLocs].sort()).toEqual([...expected].sort());
  });

  it("contains no duplicate <loc> entries", () => {
    expect(new Set(sitemapLocs).size).toBe(sitemapLocs.length);
  });

  it("uses absolute https URLs on the canonical domain", () => {
    for (const loc of sitemapLocs) expect(loc.startsWith(`${SITE_URL}/`)).toBe(true);
  });

  it("never lists a private route", () => {
    for (const loc of sitemapLocs) {
      for (const priv of privateRoutes) {
        expect(loc.replace(SITE_URL, "").startsWith(priv)).toBe(false);
      }
    }
  });

  it("keeps priorities within the 0.0-1.0 range", () => {
    for (const [, priority] of sitemap.matchAll(/<priority>([^<]+)<\/priority>/g)) {
      const value = Number(priority);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it("does not emit a generated-at lastmod fallback", () => {
    // lastmod must reflect real content changes, never build time.
    const today = new Date().toISOString().slice(0, 10);
    expect(sitemap).not.toContain(`<lastmod>${today}`);
  });
});

describe("route registry", () => {
  it("has unique paths", () => {
    const paths = seoRoutes.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("assigns an OpenGraph image to every route", () => {
    for (const route of seoRoutes) {
      expect(route.ogImage).toMatch(/^\/.+\.(jpg|png)$/);
      expect(route.ogImageAlt.length).toBeGreaterThan(10);
    }
  });
});
