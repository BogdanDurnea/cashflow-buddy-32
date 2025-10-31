import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/components/TransactionForm";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getCategoryConfig, expenseCategories } from "@/lib/categoryConfig";
import { Target } from "lucide-react";

interface BudgetVsActualChartProps {
  transactions: Transaction[];
  categoryBudgets: Array<{ category: string; limit: number }>;
}

export function BudgetVsActualChart({ transactions, categoryBudgets }: BudgetVsActualChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate actual expenses for current month
    const currentMonthExpenses = transactions
      .filter(t => {
        const date = new Date(t.date);
        return t.type === "expense" && 
               date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear;
      })
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    // Combine budgets with actual spending
    return categoryBudgets.map(budget => {
      const actual = currentMonthExpenses[budget.category] || 0;
      const config = getCategoryConfig(budget.category, "expense");
      
      return {
        category: budget.category,
        budget: budget.limit,
        actual: actual,
        remaining: Math.max(0, budget.limit - actual),
        color: config.color
      };
    }).filter(item => item.budget > 0);
  }, [transactions, categoryBudgets]);

  if (chartData.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Buget vs Cheltuieli Reale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
            Setează bugete pentru categorii pentru a vedea comparația
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-primary" />
          Buget vs Cheltuieli Reale (Luna Curentă)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip 
              formatter={(value) => formatCurrency(value as number)}
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem"
              }}
            />
            <Legend />
            <Bar dataKey="budget" name="Buget planificat" fill="hsl(var(--primary))" />
            <Bar dataKey="actual" name="Cheltuit" fill="hsl(0 84% 60%)" />
          </BarChart>
        </ResponsiveContainer>

        {/* Summary statistics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {chartData.map((item, index) => {
            const percentage = (item.actual / item.budget) * 100;
            const isOverBudget = percentage > 100;
            const isNearLimit = percentage > 80 && percentage <= 100;

            return (
              <div key={index} className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  {item.category}
                </div>
                <div className={`text-lg font-bold ${
                  isOverBudget ? "text-destructive" : 
                  isNearLimit ? "text-warning" : 
                  "text-success"
                }`}>
                  {percentage.toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(item.actual)} / {formatCurrency(item.budget)}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}