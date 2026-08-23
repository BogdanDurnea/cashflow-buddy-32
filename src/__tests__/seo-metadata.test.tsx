import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ComponentType } from "react";

import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Install from "@/pages/Install";
import Legal from "@/pages/Legal";
import NotFound from "@/pages/NotFound";
import ResetPassword from "@/pages/ResetPassword";
import ExpenseTracking from "@/pages/guides/ExpenseTracking";
import Budgeting from "@/pages/guides/Budgeting";
import Reports from "@/pages/guides/Reports";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, session: null, loading: false, signOut: vi.fn() }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      updateUser: vi.fn(),
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
  },
}));

const SITE = "https://cashflow-buddy-32.lovable.app";
const BRAND = "CashFlow Buddy";

interface PageCase {
  name: string;
  path: string;
  Component: ComponentType;
  /** Private/utility routes must not be indexed and are excluded from the sitemap. */
  indexable: boolean;
}

const PAGES: PageCase[] = [
  { name: "Landing", path: "/", Component: Landing, indexable: true },
  { name: "Auth", path: "/auth", Component: Auth, indexable: true },
  { name: "Install", path: "/install", Component: Install, indexable: true },
  { name: "Privacy", path: "/privacy", Component: () => <Legal variant="privacy" />, indexable: true },
  { name: "Terms", path: "/terms", Component: () => <Legal variant="terms" />, indexable: true },
  { name: "ExpenseTracking", path: "/urmarirea-cheltuielilor", Component: ExpenseTracking, indexable: true },
  { name: "Budgeting", path: "/bugete-personale", Component: Budgeting, indexable: true },
  { name: "Reports", path: "/rapoarte-financiare", Component: Reports, indexable: true },
  { name: "ResetPassword", path: "/reset-password", Component: ResetPassword, indexable: false },
  { name: "NotFound", path: "/pagina-inexistenta", Component: NotFound, indexable: false },
];

function renderPage({ path, Component }: PageCase) {
  // useSEO derives the canonical from window.location when no explicit one is
  // given, so the real path must be active for the assertion to be meaningful.
  window.history.replaceState({}, "", path);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Component />
    </MemoryRouter>,
  );
}

const head = {
  title: () => document.title,
  meta: (selector: string) =>
    document.head.querySelector<HTMLMetaElement>(selector)?.getAttribute("content") ?? null,
  canonical: () =>
    document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute("href") ?? null,
  canonicalCount: () => document.head.querySelectorAll('link[rel="canonical"]').length,
};

beforeEach(() => {
  document.head.querySelectorAll('link[rel="canonical"], meta[name="robots"]').forEach((el) => el.remove());
});

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

describe("canonical tags", () => {
  it.each(PAGES)("$name emits exactly one self-referential canonical", (page) => {
    renderPage(page);

    const canonical = head.canonical();
    expect(head.canonicalCount()).toBe(1);
    expect(canonical).toBeTruthy();

    const url = new URL(canonical!);
    const expectedPath = page.path === "/" ? "/" : page.path;
    expect(url.pathname).toBe(expectedPath);
    // No query strings or fragments — those create duplicate-URL variants.
    expect(url.search).toBe("");
    expect(url.hash).toBe("");
  });

  it.each(PAGES)("$name keeps og:url in sync with the canonical", (page) => {
    renderPage(page);
    expect(head.meta('meta[property="og:url"]')).toBe(head.canonical());
  });

  it("strips query strings from the canonical", () => {
    window.history.replaceState({}, "", "/install?utm_source=newsletter&ref=x");
    render(
      <MemoryRouter initialEntries={["/install"]}>
        <Install />
      </MemoryRouter>,
    );
    expect(head.canonical()).toBe(`${SITE.replace(SITE, window.location.origin)}/install`);
    expect(head.canonical()).not.toContain("utm_source");
  });

  it("guide canonicals use the absolute production domain", () => {
    renderPage(PAGES.find((p) => p.name === "Budgeting")!);
    expect(head.canonical()).toBe(`${SITE}/bugete-personale`);
  });
});

describe("meta title and description", () => {
  it.each(PAGES)("$name has a usable title", (page) => {
    renderPage(page);

    const title = head.title();
    expect(title.trim().length).toBeGreaterThan(10);
    expect(title.length).toBeLessThanOrEqual(70);
    expect(title).not.toMatch(/Lovable App|Lovable Generated Project/i);
  });

  it.each(PAGES)("$name has a usable meta description", (page) => {
    renderPage(page);

    const description = head.meta('meta[name="description"]');
    expect(description, "meta description missing").toBeTruthy();
    expect(description!.trim().length).toBeGreaterThanOrEqual(50);
    expect(description!.length).toBeLessThanOrEqual(170);
    expect(description).not.toMatch(/Lovable Generated Project/i);
  });

  it.each(PAGES)("$name mirrors title/description into Open Graph and Twitter tags", (page) => {
    renderPage(page);

    const title = head.title();
    const description = head.meta('meta[name="description"]');
    expect(head.meta('meta[property="og:title"]')).toBe(title);
    expect(head.meta('meta[property="og:description"]')).toBe(description);
    expect(head.meta('meta[name="twitter:title"]')).toBe(title);
    expect(head.meta('meta[name="twitter:description"]')).toBe(description);
  });

  it("gives every page a unique title and description", () => {
    const titles = new Map<string, string>();
    const descriptions = new Map<string, string>();

    for (const page of PAGES) {
      renderPage(page);
      titles.set(page.name, head.title());
      descriptions.set(page.name, head.meta('meta[name="description"]') ?? "");
      cleanup();
    }

    expect(new Set(titles.values()).size).toBe(PAGES.length);
    expect(new Set(descriptions.values()).size).toBe(PAGES.length);
  });

  it("uses the CashFlow Buddy brand name consistently in titles", () => {
    const offenders: string[] = [];
    for (const page of PAGES) {
      renderPage(page);
      const title = head.title();
      if (/MoneyTracker/i.test(title)) offenders.push(`${page.name}: ${title}`);
      if (!title.includes(BRAND)) offenders.push(`${page.name} missing brand: ${title}`);
      cleanup();
    }
    expect(offenders).toEqual([]);
  });
});

describe("indexing directives", () => {
  it.each(PAGES.filter((p) => !p.indexable))("$name is marked noindex", (page) => {
    renderPage(page);
    expect(head.meta('meta[name="robots"]')).toMatch(/noindex/);
  });

  it.each(PAGES.filter((p) => p.indexable))("$name is indexable", (page) => {
    renderPage(page);
    expect(head.meta('meta[name="robots"]') ?? "").not.toMatch(/noindex/);
  });
});
