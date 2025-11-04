import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Code, Download } from "lucide-react";

interface APIExportProps {
  transactions: any[];
  budgets: any[];
}

export const APIExport = ({ transactions, budgets }: APIExportProps) => {
  const exportAsJSON = () => {
    const data = {
      export_date: new Date().toISOString(),
      transactions: transactions.map(t => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: t.category,
        type: t.type,
        recurring_id: t.recurring_transaction_id,
        created_at: t.created_at
      })),
      budgets: budgets.map(b => ({
        id: b.id,
        category: b.category,
        amount: b.amount,
        month: b.month,
        year: b.year,
        created_at: b.created_at
      })),
      summary: {
        total_transactions: transactions.length,
        total_income: transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0),
        total_expenses: transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
        total_budgets: budgets.length,
        budget_total: budgets.reduce((sum, b) => sum + b.amount, 0)
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("JSON export downloaded successfully!");
  };

  const copyToClipboard = () => {
    const data = {
      export_date: new Date().toISOString(),
      transactions: transactions.slice(0, 10),
      budgets: budgets.slice(0, 10),
      note: "Showing first 10 items of each category"
    };

    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.success("API data copied to clipboard!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          API Export
        </CardTitle>
        <CardDescription>
          Export your data in JSON format for API integrations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={exportAsJSON} className="w-full" variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download JSON
        </Button>
        <Button onClick={copyToClipboard} className="w-full" variant="outline">
          <Code className="mr-2 h-4 w-4" />
          Copy to Clipboard
        </Button>
      </CardContent>
    </Card>
  );
};
