import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "./TransactionForm";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useMemo } from "react";

interface BalanceEvolutionChartProps {
  transactions: Transaction[];
}

export function BalanceEvolutionChart({ transactions }: BalanceEvolutionChartProps) {
  const chartData = useMemo(() => {
    if (transactions.length === 0) return [];

    // Sort transactions by date
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group by date and calculate running balance
    const dailyBalances: Record<string, { income: number; expense: number }> = {};
    
    sortedTransactions.forEach(t => {
      const dateKey = String(t.date);
      if (!dailyBalances[dateKey]) {
        dailyBalances[dateKey] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        dailyBalances[dateKey].income += Number(t.amount);
      } else {
        dailyBalances[dateKey].expense += Number(t.amount);
      }
    });

    // Calculate running balance
    let runningBalance = 0;
    const data = Object.entries(dailyBalances)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, values]) => {
        runningBalance += values.income - values.expense;
        return {
          date,
          formattedDate: new Date(date).toLocaleDateString('ro-RO', { 
            day: 'numeric', 
            month: 'short' 
          }),
          balance: runningBalance,
          income: values.income,
          expense: values.expense
        };
      });

    return data;
  }, [transactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      maximumFractionDigits: 0
    }).format(value);
  };

  const currentBalance = chartData.length > 0 ? chartData[chartData.length - 1].balance : 0;
  const previousBalance = chartData.length > 1 ? chartData[chartData.length - 2].balance : 0;
  const balanceChange = currentBalance - previousBalance;
  const isPositive = currentBalance >= 0;
  const isGrowing = balanceChange >= 0;

  const minBalance = Math.min(...chartData.map(d => d.balance), 0);
  const maxBalance = Math.max(...chartData.map(d => d.balance), 0);

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Evoluție sold</CardTitle>
          {chartData.length > 0 && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              isGrowing 
                ? 'bg-success/10 text-success' 
                : 'bg-danger/10 text-danger'
            }`}>
              {isGrowing ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {isGrowing ? '+' : ''}{formatCurrency(balanceChange)}
            </div>
          )}
        </div>
        {chartData.length > 0 && (
          <p className={`text-2xl font-bold ${isPositive ? 'text-success' : 'text-danger'}`}>
            {formatCurrency(currentBalance)}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            Nu există tranzacții pentru afișare
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceGradientPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="balanceGradientNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="formattedDate" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                domain={[minBalance * 1.1, maxBalance * 1.1]}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Sold']}
                labelFormatter={(label) => `Data: ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.5} />
              <Area
                type="monotone"
                dataKey="balance"
                stroke={isPositive ? "hsl(142 76% 36%)" : "hsl(0 84% 60%)"}
                strokeWidth={2}
                fill={isPositive ? "url(#balanceGradientPositive)" : "url(#balanceGradientNegative)"}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
