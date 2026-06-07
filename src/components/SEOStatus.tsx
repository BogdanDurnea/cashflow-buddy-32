import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, ExternalLink, Search, History, Download, CalendarIcon, X, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AreaChart, Area, ResponsiveContainer, Tooltip as ReTooltip, XAxis } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

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

interface HistoryEntry {
  checkedAt: string;
  verified: boolean;
  registered: boolean;
  errors: number;
  warnings: number;
}

const HISTORY_KEY = "seo-status-history";
const HISTORY_MAX = 10;
const REFRESH_INTERVAL_MS = 60_000;

export function SEOStatus() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SEOStatusData | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    } catch {
      return [];
    }
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [nextRefreshAt, setNextRefreshAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [timeMode, setTimeMode] = useState<"local" | "utc">("local");

  const tzLabel = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "local";
    } catch {
      return "local";
    }
  }, []);

  const startOfDay = (d: Date) => {
    if (timeMode === "utc") {
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0);
    }
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  };
  const endOfDay = (d: Date) => {
    if (timeMode === "utc") {
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999);
    }
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x.getTime();
  };
  const sameDay = (a: Date, b: Date) =>
    timeMode === "utc"
      ? a.getUTCFullYear() === b.getUTCFullYear() &&
        a.getUTCMonth() === b.getUTCMonth() &&
        a.getUTCDate() === b.getUTCDate()
      : a.toDateString() === b.toDateString();
  const formatDate = (d: Date) =>
    timeMode === "utc"
      ? `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
      : format(d, "dd MMM yyyy");
  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return timeMode === "utc"
      ? `${d.toISOString().slice(0, 19).replace("T", " ")} UTC`
      : d.toLocaleString("ro-RO");
  };

  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      const t = new Date(h.checkedAt).getTime();
      if (fromDate && t < startOfDay(fromDate)) return false;
      if (toDate && t > endOfDay(toDate)) return false;
      return true;
    });
  }, [history, fromDate, toDate, timeMode]);

  const load = async (silent = false) => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("seo-status");
      if (error) throw error;
      const payload = res as SEOStatusData;
      setData(payload);
      if (autoRefresh) setNextRefreshAt(Date.now() + REFRESH_INTERVAL_MS);
      setHistory((prev) => {
        const entry: HistoryEntry = {
          checkedAt: payload.checkedAt,
          verified: payload.verification.verified,
          registered: payload.searchConsole.registered,
          errors: payload.errors.length,
          warnings: payload.warnings.length,
        };
        const next = [entry, ...prev].slice(0, HISTORY_MAX);
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        } catch {
          /* ignore quota */
        }
        return next;
      });
    } catch (e) {
      if (!silent) {
        toast.error("Nu am putut încărca statusul SEO", {
          description: e instanceof Error ? e.message : "Eroare necunoscută",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!autoRefresh) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setNextRefreshAt(null);
      return;
    }
    setNextRefreshAt(Date.now() + REFRESH_INTERVAL_MS);
    timerRef.current = setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, REFRESH_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [autoRefresh]);

  // Tick every second to update countdown
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  const secondsToNext = nextRefreshAt
    ? Math.max(0, Math.ceil((nextRefreshAt - now) / 1000))
    : null;

  // Trend data for sparkline (oldest -> newest)
  const trendData = useMemo(() => {
    return [...filteredHistory]
      .slice()
      .reverse()
      .map((h) => ({
        t: new Date(h.checkedAt).getTime(),
        label: formatDateTime(h.checkedAt),
        errors: h.errors,
        warnings: h.warnings,
      }));
  }, [filteredHistory, timeMode]);

  const getExportFileSuffix = () => {
    const rangePart =
      fromDate || toDate
        ? `${fromDate ? formatDate(fromDate) : "start"}_${toDate ? formatDate(toDate) : "end"}`
        : "";
    const n = new Date();
    const stamp = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}_${String(n.getHours()).padStart(2, "0")}-${String(n.getMinutes()).padStart(2, "0")}-${String(n.getSeconds()).padStart(2, "0")}-${String(n.getMilliseconds()).padStart(3, "0")}`;
    return rangePart ? `${rangePart}_${stamp}` : stamp;
  };

  const exportHistoryCSV = () => {
    const source = filteredHistory;
    if (source.length === 0) {
      toast.error("Nu există verificări în intervalul selectat");
      return;
    }
    const headers = ["checkedAt", "verified", "registered", "errors", "warnings"];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = source.map((h) =>
      [h.checkedAt, String(h.verified), String(h.registered), String(h.errors), String(h.warnings)]
        .map(escape)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seo-status-history-${getExportFileSuffix()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportHistoryPDF = async () => {
    const source = filteredHistory;
    if (source.length === 0) {
      toast.error("Nu există verificări în intervalul selectat");
      return;
    }
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      let y = margin;

      doc.setFontSize(16);
      doc.text("Raport monitorizare SEO", margin, y);
      y += 20;
      doc.setFontSize(10);
      doc.setTextColor(120);
      const site = data?.site ?? "";
      const rangeLabel =
        fromDate || toDate
          ? `Interval: ${fromDate ? formatDate(fromDate) : "—"} → ${toDate ? formatDate(toDate) : "—"}`
          : "Interval: tot istoricul";
      doc.text(`Site: ${site}`, margin, y); y += 14;
      doc.text(rangeLabel, margin, y); y += 14;
      doc.text(`Generat: ${formatDateTime(new Date().toISOString())} (${timeMode === "utc" ? "UTC" : tzLabel})`, margin, y);
      y += 18;
      doc.setTextColor(0);

      // Snapshot curent
      if (data) {
        doc.setFontSize(12);
        doc.text("Snapshot curent", margin, y); y += 14;
        doc.setFontSize(10);
        doc.text(`Verificare: ${data.verification.verified ? "Verificat" : "Neverificat"}`, margin, y); y += 12;
        doc.text(`Search Console: ${data.searchConsole.registered ? (data.searchConsole.permissionLevel ?? "Înregistrat") : "Lipsă"}`, margin, y); y += 12;
        doc.text(`Erori: ${data.errors.length} · Avertizări: ${data.warnings.length}`, margin, y); y += 16;

        if (data.errors.length) {
          doc.setFontSize(11);
          doc.setTextColor(180, 40, 40);
          doc.text(`Erori (${data.errors.length})`, margin, y); y += 12;
          doc.setTextColor(0);
          doc.setFontSize(9);
          for (const e of data.errors) {
            const lines = doc.splitTextToSize(`• ${e}`, pageWidth - margin * 2);
            doc.text(lines, margin, y);
            y += lines.length * 11;
            if (y > 760) { doc.addPage(); y = margin; }
          }
          y += 6;
        }
        if (data.warnings.length) {
          doc.setFontSize(11);
          doc.setTextColor(180, 120, 20);
          doc.text(`Avertizări (${data.warnings.length})`, margin, y); y += 12;
          doc.setTextColor(0);
          doc.setFontSize(9);
          for (const w of data.warnings) {
            const lines = doc.splitTextToSize(`• ${w}`, pageWidth - margin * 2);
            doc.text(lines, margin, y);
            y += lines.length * 11;
            if (y > 760) { doc.addPage(); y = margin; }
          }
          y += 6;
        }
      }

      // Timeline chart snapshot
      if (chartRef.current && trendData.length > 1) {
        try {
          const canvas = await html2canvas(chartRef.current, {
            backgroundColor: "#ffffff",
            scale: 2,
          });
          const img = canvas.toDataURL("image/png");
          const imgW = pageWidth - margin * 2;
          const imgH = (canvas.height / canvas.width) * imgW;
          if (y + imgH > 780) { doc.addPage(); y = margin; }
          doc.setFontSize(12);
          doc.text("Timeline erori & avertizări", margin, y); y += 12;
          doc.addImage(img, "PNG", margin, y, imgW, imgH);
          y += imgH + 16;
        } catch {
          /* ignore chart capture errors */
        }
      }

      // History table
      if (y > 700) { doc.addPage(); y = margin; }
      doc.setFontSize(12);
      doc.text(`Istoric verificări (${source.length})`, margin, y); y += 8;

      autoTable(doc, {
        startY: y + 4,
        head: [["Data", "Verificat", "GSC", "Erori", "Avertizări"]],
        body: source.map((h) => [
          formatDateTime(h.checkedAt),
          h.verified ? "Da" : "Nu",
          h.registered ? "Da" : "Nu",
          String(h.errors),
          String(h.warnings),
        ]),
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [30, 41, 59] },
        margin: { left: margin, right: margin },
      });

      doc.save(`seo-status-report-${getExportFileSuffix()}.pdf`);
    } catch (e) {
      toast.error("Nu am putut genera PDF-ul", {
        description: e instanceof Error ? e.message : "Eroare necunoscută",
      });
    }
  };

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    if (timeMode === "utc") {
      start.setUTCDate(start.getUTCDate() - days);
    } else {
      start.setDate(start.getDate() - days);
    }
    setFromDate(start);
    setToDate(end);
  };

  const isPresetActive = (days: number) => {
    if (!fromDate || !toDate) return false;
    const expectedStart = new Date();
    const expectedEnd = new Date();
    if (timeMode === "utc") {
      expectedStart.setUTCDate(expectedStart.getUTCDate() - days);
    } else {
      expectedStart.setDate(expectedStart.getDate() - days);
    }
    return sameDay(fromDate, expectedStart) && sameDay(toDate, expectedEnd);
  };

  const DateField = ({
    value,
    onChange,
    placeholder,
  }: {
    value: Date | undefined;
    onChange: (d: Date | undefined) => void;
    placeholder: string;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-7 text-xs justify-start font-normal", !value && "text-muted-foreground")}
        >
          <CalendarIcon className="w-3 h-3 mr-1" />
          {value ? formatDate(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );

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
        <div className="flex flex-col items-end gap-2">
          <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Reîmprospătează
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoRefresh((v) => !v)}
            className="h-7 text-xs"
          >
            Auto-refresh: {autoRefresh
              ? `ON (${secondsToNext ?? 60}s)`
              : "OFF"}
          </Button>
        </div>
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
              Verificat la {formatDateTime(data.checkedAt)}
            </p>

            {history.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <History className="w-4 h-4" /> Istoric verificări ({filteredHistory.length}/{history.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("h-7 text-xs", isPresetActive(7) && "bg-primary text-primary-foreground")}
                    onClick={() => applyPreset(7)}
                  >
                    7 zile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("h-7 text-xs", isPresetActive(30) && "bg-primary text-primary-foreground")}
                    onClick={() => applyPreset(30)}
                  >
                    30 zile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn("h-7 text-xs", isPresetActive(90) && "bg-primary text-primary-foreground")}
                    onClick={() => applyPreset(90)}
                  >
                    90 zile
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Filtrează:</span>
                  <DateField value={fromDate} onChange={setFromDate} placeholder="De la" />
                  <DateField value={toDate} onChange={setToDate} placeholder="Până la" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setTimeMode((m) => (m === "local" ? "utc" : "local"))}
                    title={timeMode === "local" ? `Fus local: ${tzLabel}` : "UTC"}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {timeMode === "local" ? `Local (${tzLabel})` : "UTC"}
                  </Button>
                  {(fromDate || toDate) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setFromDate(undefined);
                        setToDate(undefined);
                      }}
                    >
                      <X className="w-3 h-3 mr-1" /> Resetează
                    </Button>
                  )}
                </div>
                {trendData.length > 1 && (
                  <div ref={chartRef} className="h-24 -mx-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="seoErr" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="seoWarn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(38 92% 50%)" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="hsl(38 92% 50%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="t" hide />
                        <ReTooltip
                          contentStyle={{
                            background: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                          labelFormatter={(_, payload) =>
                            payload?.[0]?.payload?.label ?? ""
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="warnings"
                          stroke="hsl(38 92% 50%)"
                          strokeWidth={1.5}
                          fill="url(#seoWarn)"
                          name="Avertizări"
                        />
                        <Area
                          type="monotone"
                          dataKey="errors"
                          stroke="hsl(var(--destructive))"
                          strokeWidth={1.5}
                          fill="url(#seoErr)"
                          name="Erori"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {filteredHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">
                      Nicio verificare în intervalul selectat.
                    </p>
                  ) : filteredHistory.map((h, i) => (
                    <div
                      key={`${h.checkedAt}-${i}`}
                      className="flex items-center justify-between text-xs p-2 rounded border bg-muted/20"
                    >
                      <span className="text-muted-foreground">
                        {formatDateTime(h.checkedAt)}
                      </span>
                      <div className="flex gap-1.5">
                        <Badge
                          variant="outline"
                          className={
                            h.verified
                              ? "border-green-500/40 text-green-600"
                              : "border-amber-500/40 text-amber-600"
                          }
                        >
                          {h.verified ? "Verificat" : "Neverificat"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={
                            h.registered
                              ? "border-green-500/40 text-green-600"
                              : "border-amber-500/40 text-amber-600"
                          }
                        >
                          {h.registered ? "GSC" : "—"}
                        </Badge>
                        {h.errors > 0 && <Badge variant="destructive">{h.errors}E</Badge>}
                        {h.warnings > 0 && (
                          <Badge variant="outline" className="border-amber-500/40 text-amber-600">
                            {h.warnings}W
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={exportHistoryCSV}
                    disabled={filteredHistory.length === 0}
                  >
                    <Download className="w-3 h-3 mr-1" /> Export CSV ({filteredHistory.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={exportHistoryPDF}
                    disabled={filteredHistory.length === 0}
                  >
                    <Download className="w-3 h-3 mr-1" /> Export PDF ({filteredHistory.length})
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setHistory([]);
                      try {
                        localStorage.removeItem(HISTORY_KEY);
                      } catch {
                        /* ignore */
                      }
                    }}
                  >
                    Șterge istoric
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Nu sunt date disponibile.</p>
        )}
      </CardContent>
    </Card>
  );
}