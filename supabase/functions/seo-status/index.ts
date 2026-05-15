import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://cashflow-buddy-32.lovable.app/";
const ENCODED = encodeURIComponent(SITE_URL);
const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

interface StatusResponse {
  site: string;
  verification: { verified: boolean; method?: string; error?: string };
  searchConsole: { registered: boolean; permissionLevel?: string; error?: string };
  sitemaps: Array<{ path: string; lastSubmitted?: string; isPending?: boolean; errors?: number; warnings?: number }>;
  errors: string[];
  warnings: string[];
  checkedAt: string;
}

async function gw(path: string, init?: RequestInit) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GSC_KEY = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
  if (!GSC_KEY) throw new Error("GOOGLE_SEARCH_CONSOLE_API_KEY is not configured");
  return fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GSC_KEY,
      "Content-Type": "application/json",
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const result: StatusResponse = {
    site: SITE_URL,
    verification: { verified: false },
    searchConsole: { registered: false },
    sitemaps: [],
    errors: [],
    warnings: [],
    checkedAt: new Date().toISOString(),
  };

  try {
    // 1. Site verification
    try {
      const verRes = await gw(`/siteVerification/v1/webResource/${ENCODED}`);
      if (verRes.ok) {
        const data = await verRes.json();
        result.verification.verified = true;
        result.verification.method = data.site?.type;
      } else if (verRes.status === 404) {
        result.verification.verified = false;
        result.warnings.push("Site-ul nu este verificat în Google Site Verification.");
      } else {
        const txt = await verRes.text();
        result.verification.error = `HTTP ${verRes.status}: ${txt.slice(0, 200)}`;
        result.errors.push(`Verificare: ${result.verification.error}`);
      }
    } catch (e) {
      result.verification.error = (e as Error).message;
      result.errors.push(`Verificare: ${result.verification.error}`);
    }

    // 2. Search Console site registration
    try {
      const siteRes = await gw(`/webmasters/v3/sites/${ENCODED}`);
      if (siteRes.ok) {
        const data = await siteRes.json();
        result.searchConsole.registered = true;
        result.searchConsole.permissionLevel = data.permissionLevel;
      } else if (siteRes.status === 404) {
        result.warnings.push("Site-ul nu este adăugat în Google Search Console.");
      } else {
        const txt = await siteRes.text();
        result.searchConsole.error = `HTTP ${siteRes.status}: ${txt.slice(0, 200)}`;
        result.errors.push(`Search Console: ${result.searchConsole.error}`);
      }
    } catch (e) {
      result.searchConsole.error = (e as Error).message;
      result.errors.push(`Search Console: ${result.searchConsole.error}`);
    }

    // 3. Sitemaps (only if registered)
    if (result.searchConsole.registered) {
      try {
        const smRes = await gw(`/webmasters/v3/sites/${ENCODED}/sitemaps`);
        if (smRes.ok) {
          const data = await smRes.json();
          const items = (data.sitemap ?? []) as Array<Record<string, unknown>>;
          if (items.length === 0) {
            result.warnings.push("Niciun sitemap trimis în Search Console.");
          }
          result.sitemaps = items.map((s) => {
            const errors = Number((s.contents as Array<{ submitted?: string }>)?.[0] ? 0 : 0) || Number(s.errors ?? 0);
            const warnings = Number(s.warnings ?? 0);
            if (errors > 0) result.errors.push(`Sitemap ${s.path}: ${errors} erori`);
            if (warnings > 0) result.warnings.push(`Sitemap ${s.path}: ${warnings} avertizări`);
            return {
              path: String(s.path ?? ""),
              lastSubmitted: s.lastSubmitted as string | undefined,
              isPending: Boolean(s.isPending),
              errors,
              warnings,
            };
          });
        } else {
          const txt = await smRes.text();
          result.errors.push(`Sitemaps: HTTP ${smRes.status}: ${txt.slice(0, 200)}`);
        }
      } catch (e) {
        result.errors.push(`Sitemaps: ${(e as Error).message}`);
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ ...result, errors: [...result.errors, msg] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});