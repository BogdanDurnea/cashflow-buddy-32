import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/components/TransactionForm";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { expenseCategories, incomeCategories, getCategoryConfig } from "@/lib/categoryConfig";
import { TrendingUp } from "lucide-react";
import { useState } from "react";

interface CategoryTrendChartProps {
  transactions: Transaction[];
}

export function CategoryTrendChart({ transactions }: CategoryTrendChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(expenseCategories[0].name);
  const [selectedType, setSelectedType] = useState<"expense" | "income">("expense");

  const chartData = useMemo(() => {
    const dataMap = new Map<string, { month: string; amount: number }>();
    
    // Filter transactions by selected category and type
    const filteredTransactions = transactions.filter(
      t => t.category === selectedCategory && t.type === selectedType
    );

    // Group by month
    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' });
      
      if (!dataMap.has(monthKey)) {
        dataMap.set(monthKey, { month: monthName, amount: 0 });
      }
      
      const entry = dataMap.get(monthKey)!;
      entry.amount += transaction.amount;
    });
    
    return Array.from(dataMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  }, [transactions, selectedCategory, selectedType]);

  const categories = selectedType === "expense" ? expenseCategories : incomeCategories;
  const config = getCategoryConfig(selectedCategory, selectedType);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculate trend percentage
  const trendPercentage = useMemo(() => {
    if (chartData.length < 2) return 0;
    const lastMonth = chartData[chartData.length - 1].amount;
    const previousMonth = chartData[chartData.length - 2].amount;
    if (previousMonth === 0) return 0;
    return ((lastMonth - previousMonth) / previousMonth) * 100;
  }, [chartData]);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tendințe pe Categorii
          </CardTitle>
          
          <div className="flex gap-2">
            <Select value={selectedType} onValueChange={(value: "expense" | "income") => {
              setSelectedType(value);
              setSelectedCategory(value === "expense" ? expenseCategories[0].name : incomeCategories[0].name);
            }}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Cheltuieli</SelectItem>
                <SelectItem value="income">Venituri</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <SelectItem key={cat.name} value={cat.name}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {cat.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {chartData.length >= 2 && (
          <div className={`text-sm mt-2 ${
            selectedType === "expense" 
              ? (trendPercentage < 0 ? "text-success" : "text-destructive")
              : (trendPercentage > 0 ? "text-success" : "text-destructive")
          }`}>
            {trendPercentage >= 0 ? "+" : ""}{trendPercentage.toFixed(1)}% față de luna trecută
          </div>
        )}
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
            Nu există date pentru categoria selectată
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
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
              <Line 
                type="monotone" 
                dataKey="amount" 
                name={selectedCategory}
                stroke={config.color}
                strokeWidth={2}
                dot={{ fill: config.color, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}