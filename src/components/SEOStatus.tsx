import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, ExternalLink, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Sitemap {
  path: string;
  lastSubmitted?: string;
  isPending?: boolean;
  errors?: number;
  warnings?: number;
}

interface SEOStatusData {
  site: string;
  verification: { verified: boolean; method?: string; error?: string };
  searchConsole: { registered: boolean; permissionLevel?: string; error?: string };
  sitemaps: Sitemap[];
  errors: string[];
  warnings: string[];
  checkedAt: string;
}

export function SEOStatus() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SEOStatusData | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("seo-status");
      if (error) throw error;
      setData(res as SEOStatusData);
    } catch (e) {
      toast.error("Nu am putut încărca statusul SEO", {
        description: e instanceof Error ? e.message : "Eroare necunoscută",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const StatusBadge = ({ ok, labelOk, labelKo }: { ok: boolean; labelOk: string; labelKo: string }) =>
    ok ? (
      <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/20 border-green-500/30">
        <CheckCircle2 className="w-3 h-3 mr-1" /> {labelOk}
      </Badge>
    ) : (
      <Badge variant="outline" className="border-amber-500/40 text-amber-600">
        <AlertTriangle className="w-3 h-3 mr-1" /> {labelKo}
      </Badge>
    );

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" /> Status SEO & Verificare
          </CardTitle>
          <CardDescription>
            Verificarea Google Site Verification și Google Search Console pentru{" "}
            <span className="font-mono text-xs">{data?.site ?? "site-ul tău"}</span>
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Reîmprospătează
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && !data ? (
          <p className="text-sm text-muted-foreground">Se încarcă...</p>
        ) : data ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Site Verification</span>
                  <StatusBadge ok={data.verification.verified} labelOk="Verificat" labelKo="Neverificat" />
                </div>
                {data.verification.error && (
                  <p className="text-xs text-destructive">{data.verification.error}</p>
                )}
              </div>
              <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Search Console</span>
                  <StatusBadge
                    ok={data.searchConsole.registered}
                    labelOk={data.searchConsole.permissionLevel ?? "Înregistrat"}
                    labelKo="Lipsă"
                  />
                </div>
                {data.searchConsole.error && (
                  <p className="text-xs text-destructive">{data.searchConsole.error}</p>
                )}
              </div>
            </div>

            {data.sitemaps.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Sitemap-uri</h4>
                <div className="space-y-2">
                  {data.sitemaps.map((s) => (
                    <div key={s.path} className="p-3 rounded-lg border flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-mono truncate">{s.path}</p>
                        {s.lastSubmitted && (
                          <p className="text-xs text-muted-foreground">
                            Trimis: {new Date(s.lastSubmitted).toLocaleString("ro-RO")}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {(s.errors ?? 0) > 0 && (
                          <Badge variant="destructive">{s.errors} erori</Badge>
                        )}
                        {(s.warnings ?? 0) > 0 && (
                          <Badge variant="outline" className="border-amber-500/40 text-amber-600">
                            {s.warnings} avertizări
                          </Badge>
                        )}
                        {s.isPending && <Badge variant="outline">În procesare</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.errors.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Erori ({data.errors.length})</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 mt-2 space-y-1 text-sm">
                    {data.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {data.warnings.length > 0 && (
              <Alert className="border-amber-500/40">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle>Avertizări ({data.warnings.length})</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 mt-2 space-y-1 text-sm">
                    {data.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {data.errors.length === 0 && data.warnings.length === 0 && (
              <Alert className="border-green-500/40">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Totul în ordine</AlertTitle>
                <AlertDescription>Nu există erori sau avertizări SEO active.</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" asChild>
                <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3 mr-2" /> Deschide Search Console
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href={`${data.site}sitemap.xml`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3 mr-2" /> Vezi sitemap.xml
                </a>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Verificat la {new Date(data.checkedAt).toLocaleString("ro-RO")}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Nu sunt date disponibile.</p>
        )}
      </CardContent>
    </Card>
  );
}