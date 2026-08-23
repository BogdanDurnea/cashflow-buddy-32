/**
 * Structural validator for the JSON-LD we inject via `useSEO`.
 * Used by the CI check (`src/__tests__/seo-jsonld.test.tsx`) so a broken or
 * missing schema fails the build instead of silently degrading rich results.
 */

export type JsonLdNode = Record<string, unknown>;

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

const isAbsoluteUrl = (v: unknown): v is string =>
  isNonEmptyString(v) && /^https:\/\/[^\s]+$/.test(v);

function validateFaqPage(node: JsonLdNode, where: string): string[] {
  const errors: string[] = [];
  const entities = node.mainEntity;

  if (!Array.isArray(entities) || entities.length === 0) {
    errors.push(`${where}: FAQPage.mainEntity must be a non-empty array`);
    return errors;
  }

  const seen = new Set<string>();
  entities.forEach((raw, i) => {
    const q = raw as JsonLdNode;
    const at = `${where}: FAQPage.mainEntity[${i}]`;
    if (q?.["@type"] !== "Question") errors.push(`${at} must have @type "Question"`);
    if (!isNonEmptyString(q?.name)) errors.push(`${at} is missing a non-empty "name"`);
    else if (seen.has(q.name)) errors.push(`${at} duplicates question "${q.name}"`);
    else seen.add(q.name);

    const answer = q?.acceptedAnswer as JsonLdNode | undefined;
    if (!answer || answer["@type"] !== "Answer") {
      errors.push(`${at} needs an acceptedAnswer of @type "Answer"`);
    } else if (!isNonEmptyString(answer.text)) {
      errors.push(`${at}.acceptedAnswer is missing a non-empty "text"`);
    }
  });

  return errors;
}

function validateBreadcrumbList(node: JsonLdNode, where: string): string[] {
  const errors: string[] = [];
  const items = node.itemListElement;

  if (!Array.isArray(items) || items.length < 2) {
    errors.push(`${where}: BreadcrumbList.itemListElement needs at least 2 items`);
    return errors;
  }

  items.forEach((raw, i) => {
    const item = raw as JsonLdNode;
    const at = `${where}: BreadcrumbList.itemListElement[${i}]`;
    if (item?.["@type"] !== "ListItem") errors.push(`${at} must have @type "ListItem"`);
    if (item?.position !== i + 1) errors.push(`${at} must have position ${i + 1}`);
    if (!isNonEmptyString(item?.name)) errors.push(`${at} is missing a non-empty "name"`);
    if (!isAbsoluteUrl(item?.item)) errors.push(`${at}.item must be an absolute https URL`);
  });

  return errors;
}

function validateOrganization(node: JsonLdNode, where: string): string[] {
  const errors: string[] = [];
  if (!isNonEmptyString(node.name)) errors.push(`${where}: Organization needs a "name"`);
  if (!isAbsoluteUrl(node.url)) errors.push(`${where}: Organization.url must be an absolute https URL`);

  const logo = node.logo;
  const logoUrl = typeof logo === "object" && logo ? (logo as JsonLdNode).url : logo;
  if (!isAbsoluteUrl(logoUrl)) {
    errors.push(`${where}: Organization.logo must resolve to an absolute https URL`);
  }

  if (node.sameAs !== undefined) {
    if (!Array.isArray(node.sameAs) || node.sameAs.length === 0) {
      errors.push(`${where}: Organization.sameAs must be a non-empty array when present`);
    } else {
      node.sameAs.forEach((link, i) => {
        if (!isAbsoluteUrl(link)) {
          errors.push(`${where}: Organization.sameAs[${i}] must be an absolute https URL`);
        }
      });
    }
  }

  return errors;
}

function validateWebSite(node: JsonLdNode, where: string): string[] {
  const errors: string[] = [];
  if (!isNonEmptyString(node.name)) errors.push(`${where}: WebSite needs a "name"`);
  if (!isAbsoluteUrl(node.url)) errors.push(`${where}: WebSite.url must be an absolute https URL`);

  const publisher = node.publisher as JsonLdNode | undefined;
  if (publisher && !isNonEmptyString(publisher["@id"]) && !isNonEmptyString(publisher.name)) {
    errors.push(`${where}: WebSite.publisher needs an @id reference or a name`);
  }

  return errors;
}

/** Validates a single JSON-LD node. Returns human-readable error strings. */
export function validateJsonLdNode(node: unknown, where = "JSON-LD"): string[] {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return [`${where}: node must be a JSON object`];
  }

  const obj = node as JsonLdNode;
  const errors: string[] = [];

  if (obj["@context"] !== "https://schema.org") {
    errors.push(`${where}: @context must be "https://schema.org"`);
  }

  const type = obj["@type"];
  if (!isNonEmptyString(type)) {
    errors.push(`${where}: @type is required`);
    return errors;
  }

  switch (type) {
    case "FAQPage":
      return [...errors, ...validateFaqPage(obj, where)];
    case "BreadcrumbList":
      return [...errors, ...validateBreadcrumbList(obj, where)];
    case "Organization":
      return [...errors, ...validateOrganization(obj, where)];
    case "WebSite":
      return [...errors, ...validateWebSite(obj, where)];

    default:
      return errors;
  }
}

/** Parses and validates every JSON-LD script in a document head. */
export function validateJsonLdInDocument(
  doc: Document,
  where = "document",
): { types: string[]; errors: string[] } {
  const scripts = Array.from(
    doc.head.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'),
  );
  const types: string[] = [];
  const errors: string[] = [];

  scripts.forEach((script, i) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(script.textContent || "");
    } catch {
      errors.push(`${where}: script[${i}] contains invalid JSON`);
      return;
    }
    for (const node of Array.isArray(parsed) ? parsed : [parsed]) {
      const t = (node as JsonLdNode)?.["@type"];
      if (typeof t === "string") types.push(t);
      errors.push(...validateJsonLdNode(node, `${where} script[${i}]`));
    }
  });

  return { types, errors };
}
