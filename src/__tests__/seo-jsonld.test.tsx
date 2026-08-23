import { describe, expect, it, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { validateJsonLdInDocument, validateJsonLdNode } from "@/lib/seo/validateJsonLd";
import ExpenseTracking from "@/pages/guides/ExpenseTracking";
import Budgeting from "@/pages/guides/Budgeting";
import Reports from "@/pages/guides/Reports";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, session: null, loading: false, signOut: vi.fn() }),
}));

const GUIDE_PAGES = [
  { name: "ExpenseTracking", path: "/urmarirea-cheltuielilor", Component: ExpenseTracking },
  { name: "Budgeting", path: "/bugete-personale", Component: Budgeting },
  { name: "Reports", path: "/rapoarte-financiare", Component: Reports },
];

const SITE = "https://cashflow-buddy-32.lovable.app";

function readJsonLd() {
  return Array.from(
    document.head.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'),
  ).map((s) => JSON.parse(s.textContent || "{}") as Record<string, unknown>);
}

afterEach(() => {
  cleanup();
  document.head.querySelectorAll("script[data-seo-jsonld]").forEach((el) => el.remove());
});

describe("guide pages emit valid JSON-LD", () => {
  it.each(GUIDE_PAGES)("$name has schema-valid structured data", ({ path, Component }) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Component />
      </MemoryRouter>,
    );

    const { types, errors } = validateJsonLdInDocument(document, path);
    expect(errors).toEqual([]);
    expect(types).toContain("FAQPage");
    expect(types).toContain("BreadcrumbList");
  });

  it.each(GUIDE_PAGES)("$name breadcrumb self-references its canonical URL", ({ path, Component }) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Component />
      </MemoryRouter>,
    );

    const breadcrumb = readJsonLd().find((n) => n["@type"] === "BreadcrumbList");
    expect(breadcrumb, "BreadcrumbList missing").toBeTruthy();

    const items = breadcrumb!.itemListElement as { item: string }[];
    expect(items[items.length - 1].item).toBe(`${SITE}${path}`);

    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    expect(canonical?.href).toBe(`${SITE}${path}`);
  });

  it.each(GUIDE_PAGES)("$name FAQ answers are visible in the rendered page", ({ path, Component }) => {
    const { container } = render(
      <MemoryRouter initialEntries={[path]}>
        <Component />
      </MemoryRouter>,
    );

    const faq = readJsonLd().find((n) => n["@type"] === "FAQPage");
    const questions = (faq!.mainEntity as { name: string; acceptedAnswer: { text: string } }[]);
    expect(questions.length).toBeGreaterThanOrEqual(2);

    // Google requires the marked-up FAQ content to also be visible on the page.
    const text = container.textContent || "";
    for (const q of questions) {
      expect(text).toContain(q.name);
      expect(text).toContain(q.acceptedAnswer.text);
    }
  });

  it("removes structured data on unmount so routes don't accumulate schema", () => {
    const view = render(
      <MemoryRouter initialEntries={["/bugete-personale"]}>
        <Budgeting />
      </MemoryRouter>,
    );
    expect(readJsonLd().length).toBeGreaterThan(0);
    view.unmount();
    expect(readJsonLd().length).toBe(0);
  });
});

describe("validateJsonLdNode catches regressions", () => {
  it("rejects an FAQ question without an answer", () => {
    const errors = validateJsonLdNode({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [{ "@type": "Question", name: "De ce?" }],
    });
    expect(errors.join(" ")).toMatch(/acceptedAnswer/);
  });

  it("rejects breadcrumbs with out-of-order positions or relative URLs", () => {
    const errors = validateJsonLdNode({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Acasă", item: "/" },
        { "@type": "ListItem", position: 3, name: "Ghid", item: `${SITE}/x` },
      ],
    });
    expect(errors.join(" ")).toMatch(/absolute https URL/);
    expect(errors.join(" ")).toMatch(/position 2/);
  });

  it("rejects a wrong @context", () => {
    const errors = validateJsonLdNode({ "@context": "http://schema.org", "@type": "FAQPage" });
    expect(errors.join(" ")).toMatch(/@context/);
  });
});
