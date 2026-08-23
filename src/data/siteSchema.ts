/**
 * Site-wide schema.org nodes (Organization + WebSite) injected on every page
 * by `useSEO`, so Google always resolves the same publisher entity.
 */

import { SITE_URL, DEFAULT_OG_IMAGE } from "@/data/seoRoutes";

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const ORGANIZATION_NAME = "CashFlow Buddy";
export const ORGANIZATION_LOGO = `${SITE_URL}/icon-512.png`;

/** Public profiles / canonical destinations for the same entity. */
export const SAME_AS: string[] = [`${SITE_URL}/`];

export const organizationSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: ORGANIZATION_NAME,
  alternateName: "CashFlow Buddy — finanțe personale",
  url: `${SITE_URL}/`,
  logo: {
    "@type": "ImageObject",
    url: ORGANIZATION_LOGO,
    width: 512,
    height: 512,
    caption: `${ORGANIZATION_NAME} logo`,
  },
  image: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
  description:
    "CashFlow Buddy este o aplicație de finanțe personale cu bugete, scanare AI a bonurilor și rapoarte lunare.",
  sameAs: SAME_AS,
};

export const websiteSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: ORGANIZATION_NAME,
  url: `${SITE_URL}/`,
  inLanguage: "ro-RO",
  publisher: { "@id": ORGANIZATION_ID },
};

/** Nodes present on every important page. */
export const siteSchemaNodes: Record<string, unknown>[] = [
  organizationSchema,
  websiteSchema,
];
