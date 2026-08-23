/**
 * Single source of truth for the site's public URL surface.
 *
 * Consumed by:
 *  - `useSEO` / `SeoContentPage` for canonical + OpenGraph image resolution
 *  - `src/__tests__/seo-files.test.ts` (robots.txt / sitemap.xml validation)
 *  - `e2e/*.spec.ts` (rendered-HTML checks in the browser)
 *  - `scripts/check-og-images.mjs` (image existence + dimension normalization)
 */

export const SITE_URL = "https://cashflow-buddy-32.lovable.app";

/** Recommended OpenGraph / Twitter summary_large_image dimensions. */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export const DEFAULT_OG_IMAGE = "/og-image.jpg";
export const DEFAULT_OG_IMAGE_ALT =
  "CashFlow Buddy — aplicație de finanțe personale cu bugete și scanare AI a bonurilor";

export interface SeoRoute {
  path: string;
  /** Indexable routes belong in the sitemap and must not be disallowed. */
  indexable: boolean;
  /** Public path of the social preview image served from /public. */
  ogImage: string;
  ogImageAlt: string;
  changefreq?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: string;
}

export const seoRoutes: SeoRoute[] = [
  {
    path: "/",
    indexable: true,
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: DEFAULT_OG_IMAGE_ALT,
    changefreq: "weekly",
    priority: "1.0",
  },
  {
    path: "/auth",
    indexable: true,
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: DEFAULT_OG_IMAGE_ALT,
    changefreq: "monthly",
    priority: "0.6",
  },
  {
    path: "/install",
    indexable: true,
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: DEFAULT_OG_IMAGE_ALT,
    changefreq: "monthly",
    priority: "0.5",
  },
  {
    path: "/privacy",
    indexable: true,
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: DEFAULT_OG_IMAGE_ALT,
    changefreq: "yearly",
    priority: "0.4",
  },
  {
    path: "/terms",
    indexable: true,
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: DEFAULT_OG_IMAGE_ALT,
    changefreq: "yearly",
    priority: "0.4",
  },
  {
    path: "/urmarirea-cheltuielilor",
    indexable: true,
    ogImage: "/og-urmarirea-cheltuielilor.jpg",
    ogImageAlt: "Ghid CashFlow Buddy pentru urmărirea cheltuielilor zilnice",
    changefreq: "monthly",
    priority: "0.8",
  },
  {
    path: "/bugete-personale",
    indexable: true,
    ogImage: "/og-bugete-personale.jpg",
    ogImageAlt: "Ghid CashFlow Buddy pentru bugetul personal 50/30/20",
    changefreq: "monthly",
    priority: "0.8",
  },
  {
    path: "/rapoarte-financiare",
    indexable: true,
    ogImage: "/og-rapoarte-financiare.jpg",
    ogImageAlt: "Ghid CashFlow Buddy pentru rapoarte financiare lunare",
    changefreq: "monthly",
    priority: "0.8",
  },
];

/** Private/utility routes: never indexed, never in the sitemap. */
export const privateRoutes = ["/dashboard", "/reset-password", "/shared/", "/.lovable/"];

export const indexableRoutes = () => seoRoutes.filter((r) => r.indexable);

export const seoRouteFor = (path: string) =>
  seoRoutes.find((r) => r.path === path.replace(/\/+$/, "") || r.path === path);

export const ogImageFor = (path: string) => {
  const route = seoRouteFor(path);
  return {
    url: `${SITE_URL}${route?.ogImage ?? DEFAULT_OG_IMAGE}`,
    alt: route?.ogImageAlt ?? DEFAULT_OG_IMAGE_ALT,
  };
};
