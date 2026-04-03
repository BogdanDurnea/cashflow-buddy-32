import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "./TransactionForm";
import { toast } from "sonner";
import { FileText, Sparkles, Loader2, Calendar, Table2, TrendingUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

interface AdvancedPDFExportProps {
  transactions: Transaction[];
  monthlyBudget: number;
  categoryBudgets: Record<string, number>;
}

export function AdvancedPDFExport({ transactions, monthlyBudget, categoryBudgets }: AdvancedPDFExportProps) {
  const [loading, setLoading] = useState(false);
  const [includeAISummary, setIncludeAISummary] = useState(true);
  const [includeComparison, setIncludeComparison] = useState(true);
  const [includeDetailedTable, setIncludeDetailedTable] = useState(true);

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  const currentMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= currentMonthStart && d <= currentMonthEnd;
  });

  const prevMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= prevMonthStart && d <= prevMonthEnd;
  });

  const calcStats = (txs: Transaction[]) => {
    const income = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const byCategory: Record<string, number> = {};
    txs.filter(t => t.type === "expense").forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });
    return { income, expense, balance: income - expense, byCategory, count: txs.length };
  };

  const fetchAISummary = async (): Promise<string> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return "Nu s-a putut genera sumarul AI (sesiune expirată).";

      const response = await supabase.functions.invoke("ai-insights", {
        body: {
          transactions: currentMonthTx.slice(0, 100).map(t => ({
            amount: t.amount,
            category: t.category,
            type: t.type,
            date: format(new Date(t.date), "yyyy-MM-dd"),
            description: t.description || null,
          })),
          categoryBudgets,
          monthlyBudget,
        },
      });

      if (response.error) throw response.error;

      const data = response.data;
      const parts: string[] = [];

      if (data.predictions?.explanation) {
        parts.push(`Prognoza: ${data.predictions.explanation}`);
      }
      if (data.savings?.suggestions?.length > 0) {
        parts.push(`Sugestii de economisire: ${data.savings.suggestions.map((s: any) => s.tip).join("; ")}`);
      }
      if (data.insights?.length > 0) {
        parts.push(`Insights: ${data.insights.map((i: any) => i.description).join("; ")}`);
      }

      return parts.length > 0 ? parts.join("\n\n") : "Nu sunt suficiente date pentru analiză.";
    } catch (err) {
      console.error("AI summary error:", err);
      return "Eroare la generarea sumarului AI.";
    }
  };

  const formatAmount = (n: number) =>
    new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const handleExport = async () => {
    if (currentMonthTx.length === 0) {
      toast.error("Nu există tranzacții luna aceasta.");
      return;
    }

    setLoading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      const current = calcStats(currentMonthTx);
      const prev = calcStats(prevMonthTx);

      let y = 20;
      const pageW = doc.internal.pageSize.width;
      const margin = 14;
      const contentW = pageW - margin * 2;

      // Title
      doc.setFontSize(20);
      doc.text("Raport Financiar Avansat", margin, y);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`${format(currentMonthStart, "MMMM yyyy")} | Generat: ${format(now, "dd.MM.yyyy HH:mm")}`, margin, y);
      doc.setTextColor(0);
      y += 12;

      // Summary box
      doc.setFillColor(240, 240, 245);
      doc.roundedRect(margin, y, contentW, 28, 3, 3, "F");
      y += 8;
      doc.setFontSize(11);
      doc.text(`Venituri: ${formatAmount(current.income)} RON`, margin + 5, y);
      doc.text(`Cheltuieli: ${formatAmount(current.expense)} RON`, margin + 65, y);
      doc.text(`Sold: ${formatAmount(current.balance)} RON`, margin + 130, y);
      y += 7;
      doc.setFontSize(9);
      doc.text(`Tranzacții: ${current.count}  |  Buget lunar: ${formatAmount(monthlyBudget)} RON`, margin + 5, y);
      y += 18;

      // AI Summary
      if (includeAISummary) {
        const aiSummary = await fetchAISummary();
        doc.setFontSize(13);
        doc.text("Sumar Executiv AI", margin, y);
        y += 2;
        doc.setDrawColor(100, 100, 200);
        doc.line(margin, y, margin + 50, y);
        doc.setDrawColor(0);
        y += 6;
        doc.setFontSize(9);

        const lines = doc.splitTextToSize(aiSummary, contentW - 10);
        for (const line of lines) {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.text(line, margin + 5, y);
          y += 5;
        }
        y += 8;
      }

      // Month comparison
      if (includeComparison && prevMonthTx.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFontSize(13);
        doc.text("Comparație cu luna precedentă", margin, y);
        y += 2;
        doc.setDrawColor(100, 200, 100);
        doc.line(margin, y, margin + 60, y);
        doc.setDrawColor(0);
        y += 8;

        doc.setFontSize(9);
        const compRows = [
          ["Indicator", format(prevMonthStart, "MMM yyyy"), format(currentMonthStart, "MMM yyyy"), "Diferență"],
          ["Venituri", `${formatAmount(prev.income)}`, `${formatAmount(current.income)}`, `${formatAmount(current.income - prev.income)}`],
          ["Cheltuieli", `${formatAmount(prev.expense)}`, `${formatAmount(current.expense)}`, `${formatAmount(current.expense - prev.expense)}`],
          ["Sold", `${formatAmount(prev.balance)}`, `${formatAmount(current.balance)}`, `${formatAmount(current.balance - prev.balance)}`],
          ["Nr. tranzacții", `${prev.count}`, `${current.count}`, `${current.count - prev.count}`],
        ];

        // Table header
        const colWidths = [35, 40, 40, 40];
        let x = margin;
        doc.setFillColor(230, 230, 240);
        doc.rect(margin, y - 4, contentW, 7, "F");
        doc.setFont(undefined!, "bold");
        compRows[0].forEach((cell, i) => {
          doc.text(cell, x + 2, y);
          x += colWidths[i];
        });
        doc.setFont(undefined!, "normal");
        y += 7;

        for (let r = 1; r < compRows.length; r++) {
          if (y > 275) { doc.addPage(); y = 20; }
          x = margin;
          if (r % 2 === 0) {
            doc.setFillColor(248, 248, 250);
            doc.rect(margin, y - 4, contentW, 6, "F");
          }
          compRows[r].forEach((cell, i) => {
            doc.text(cell, x + 2, y);
            x += colWidths[i];
          });
          y += 6;
        }

        // Category comparison
        y += 6;
        doc.setFontSize(10);
        doc.text("Comparație pe categorii:", margin, y);
        y += 6;
        doc.setFontSize(8);

        const allCats = [...new Set([...Object.keys(current.byCategory), ...Object.keys(prev.byCategory)])];
        allCats.sort((a, b) => (current.byCategory[b] || 0) - (current.byCategory[a] || 0));

        for (const cat of allCats.slice(0, 10)) {
          if (y > 275) { doc.addPage(); y = 20; }
          const curVal = current.byCategory[cat] || 0;
          const prevVal = prev.byCategory[cat] || 0;
          const diff = curVal - prevVal;
          const arrow = diff > 0 ? "↑" : diff < 0 ? "↓" : "=";
          doc.text(
            `${cat}: ${formatAmount(curVal)} RON (luna trecută: ${formatAmount(prevVal)} RON, ${arrow} ${formatAmount(Math.abs(diff))})`,
            margin + 5,
            y
          );
          y += 5;
        }
        y += 8;
      }

      // Detailed transactions table
      if (includeDetailedTable) {
        if (y > 200) { doc.addPage(); y = 20; }
        doc.setFontSize(13);
        doc.text("Tabel detaliat tranzacții", margin, y);
        y += 2;
        doc.setDrawColor(200, 100, 100);
        doc.line(margin, y, margin + 55, y);
        doc.setDrawColor(0);
        y += 8;

        // Header
        doc.setFontSize(8);
        doc.setFillColor(230, 230, 240);
        doc.rect(margin, y - 4, contentW, 7, "F");
        doc.setFont(undefined!, "bold");
        const cols = [
          { label: "Data", x: margin + 2, w: 22 },
          { label: "Tip", x: margin + 24, w: 15 },
          { label: "Categorie", x: margin + 39, w: 30 },
          { label: "Sumă (RON)", x: margin + 69, w: 25 },
          { label: "Descriere", x: margin + 94, w: 88 },
        ];
        cols.forEach((c) => doc.text(c.label, c.x, y));
        doc.setFont(undefined!, "normal");
        y += 7;

        // Sort by date desc
        const sorted = [...currentMonthTx].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        for (let i = 0; i < sorted.length; i++) {
          if (y > 280) { doc.addPage(); y = 20; }
          const t = sorted[i];
          if (i % 2 === 0) {
            doc.setFillColor(248, 248, 250);
            doc.rect(margin, y - 3.5, contentW, 5.5, "F");
          }
          doc.text(format(new Date(t.date), "dd.MM.yyyy"), cols[0].x, y);
          doc.text(t.type === "income" ? "Venit" : "Chelt.", cols[1].x, y);
          doc.text(t.category.substring(0, 15), cols[2].x, y);
          doc.text(formatAmount(t.amount), cols[3].x, y);
          doc.text((t.description || "-").substring(0, 45), cols[4].x, y);
          y += 5.5;
        }
      }

      // Footer on last page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(
          `MoneyTracker - Pagina ${i} din ${pageCount}`,
          pageW / 2,
          290,
          { align: "center" }
        );
        doc.setTextColor(0);
      }

      doc.save(`raport-avansat-${format(now, "yyyy-MM")}.pdf`);
      toast.success("Raport PDF avansat generat cu succes!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Eroare la generarea raportului PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Export PDF Avansat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Generează un raport PDF complet cu analiză AI, comparații lunare și tabel detaliat.
        </p>

        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="ai-summary"
              checked={includeAISummary}
              onCheckedChange={(c) => setIncludeAISummary(c as boolean)}
            />
            <Label htmlFor="ai-summary" className="flex items-center gap-2 cursor-pointer">
              <Sparkles className="h-4 w-4 text-primary" />
              Sumar executiv AI
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="comparison"
              checked={includeComparison}
              onCheckedChange={(c) => setIncludeComparison(c as boolean)}
            />
            <Label htmlFor="comparison" className="flex items-center gap-2 cursor-pointer">
              <Calendar className="h-4 w-4 text-primary" />
              Comparație lună precedentă
            </Label>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="detailed-table"
              checked={includeDetailedTable}
              onCheckedChange={(c) => setIncludeDetailedTable(c as boolean)}
            />
            <Label htmlFor="detailed-table" className="flex items-center gap-2 cursor-pointer">
              <Table2 className="h-4 w-4 text-primary" />
              Tabel detaliat tranzacții
            </Label>
          </div>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
          <p><strong>Luna curentă:</strong> {currentMonthTx.length} tranzacții</p>
          <p><strong>Luna precedentă:</strong> {prevMonthTx.length} tranzacții</p>
        </div>

        <Button
          onClick={handleExport}
          disabled={loading || currentMonthTx.length === 0}
          className="w-full gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Se generează raportul...
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4" />
              Generează Raport PDF Avansat
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
