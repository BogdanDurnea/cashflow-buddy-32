import { useEffect } from "react";
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "@/data/seoRoutes";
import { siteSchemaNodes } from "@/data/siteSchema";


interface SEOOptions {
  title: string;
  description?: string;
  canonical?: string;
  noIndex?: boolean;
  /** Absolute URL of the social preview image (1200x630). */
  image?: string;
  imageAlt?: string;
  /** Structured data objects rendered as <script type="application/ld+json"> */
  jsonLd?: Record<string, unknown>[];
}




function setMeta(selector: string, attr: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    const [, key, name] = selector.match(/\[(.+?)="(.+?)"\]/) || [];
    if (key && name) el.setAttribute(key, name);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useSEO({
  title,
  description,
  canonical,
  noIndex,
  image,
  imageAlt,
  jsonLd,
}: SEOOptions) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    if (description) {
      setMeta('meta[name="description"]', "content", description);
      setMeta('meta[property="og:description"]', "content", description);
    }
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[name="twitter:title"]', "content", title);
    if (description) setMeta('meta[name="twitter:description"]', "content", description);

    // Social preview: OG and Twitter always stay in sync, with the recommended
    // 1200x630 dimensions declared so scrapers don't have to fetch the file.
    if (image) {
      setMeta('meta[property="og:image"]', "content", image);
      setMeta('meta[property="og:image:width"]', "content", String(OG_IMAGE_WIDTH));
      setMeta('meta[property="og:image:height"]', "content", String(OG_IMAGE_HEIGHT));
      if (imageAlt) {
        setMeta('meta[property="og:image:alt"]', "content", imageAlt);
        setMeta('meta[name="twitter:image:alt"]', "content", imageAlt);
      }
      setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
      setMeta('meta[name="twitter:image"]', "content", image);
    }



    // Canonical must be the clean page URL: no query strings, no hash,
    // otherwise Google treats ?foo=1 variants as separate duplicate pages.
    const url =
      canonical ||
      (typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname.replace(/\/+$/, "") || "/"}`
        : "/");
    setLink("canonical", url);
    setMeta('meta[property="og:url"]', "content", url);

    if (noIndex) {
      setMeta('meta[name="robots"]', "content", "noindex, nofollow");
    } else {
      const robots = document.head.querySelector('meta[name="robots"]');
      if (robots) robots.remove();
    }

    // Structured data: managed exclusively by this hook, removed on unmount so
    // routes never accumulate stale schema.
    document.head
      .querySelectorAll('script[data-seo-jsonld="true"]')
      .forEach((el) => el.remove());
    if (jsonLdKey) {
      for (const item of JSON.parse(jsonLdKey) as Record<string, unknown>[]) {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute("data-seo-jsonld", "true");
        script.textContent = JSON.stringify(item);
        document.head.appendChild(script);
      }
    }

    return () => {
      document.title = prevTitle;
      document.head
        .querySelectorAll('script[data-seo-jsonld="true"]')
        .forEach((el) => el.remove());
    };
  }, [title, description, canonical, noIndex, image, imageAlt, jsonLdKey]);
}

