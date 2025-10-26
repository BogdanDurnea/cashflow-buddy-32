import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Transaction } from "@/components/TransactionForm";
import { FileText, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

interface ReportsSectionProps {
  transactions: Transaction[];
}

export function ReportsSection({ transactions }: ReportsSectionProps) {
  // Monthly comparison data
  const monthlyData = useMemo(() => {
    const dataMap = new Map<string, { month: string; income: number; expense: number }>();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' });
      
      if (!dataMap.has(monthKey)) {
        dataMap.set(monthKey, { month: monthName, income: 0, expense: 0 });
      }
      
      const entry = dataMap.get(monthKey)!;
      if (transaction.type === "income") {
        entry.income += transaction.amount;
      } else {
        entry.expense += transaction.amount;
      }
    });
    
    return Array.from(dataMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  }, [transactions]);

  // Yearly comparison data
  const yearlyData = useMemo(() => {
    const dataMap = new Map<number, { year: string; income: number; expense: number; savings: number }>();
    
    transactions.forEach(transaction => {
      const year = new Date(transaction.date).getFullYear();
      
      if (!dataMap.has(year)) {
        dataMap.set(year, { year: year.toString(), income: 0, expense: 0, savings: 0 });
      }
      
      const entry = dataMap.get(year)!;
      if (transaction.type === "income") {
        entry.income += transaction.amount;
      } else {
        entry.expense += transaction.amount;
      }
      entry.savings = entry.income - entry.expense;
    });
    
    return Array.from(dataMap.values()).sort((a, b) => a.year.localeCompare(b.year));
  }, [transactions]);

  // Savings trend over last 6 months
  const savingsTrend = useMemo(() => {
    return monthlyData.map(month => ({
      month: month.month,
      savings: month.income - month.expense
    }));
  }, [monthlyData]);

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
    });
    
    const currentIncome = currentMonthTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const currentExpense = currentMonthTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    const lastIncome = lastMonthTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const lastExpense = lastMonthTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    
    const incomeChange = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0;
    const expenseChange = lastExpense > 0 ? ((currentExpense - lastExpense) / lastExpense) * 100 : 0;
    
    return {
      currentIncome,
      currentExpense,
      incomeChange,
      expenseChange,
      currentSavings: currentIncome - currentExpense
    };
  }, [transactions]);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Rapoarte Financiare
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monthly">Lunar</TabsTrigger>
            <TabsTrigger value="yearly">Anual</TabsTrigger>
            <TabsTrigger value="trends">Tendințe</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Venituri luna curentă</p>
                      <p className="text-2xl font-bold text-success">{stats.currentIncome.toFixed(2)} RON</p>
                    </div>
                    <TrendingUp className={`h-8 w-8 ${stats.incomeChange >= 0 ? "text-success" : "text-destructive"}`} />
                  </div>
                  <p className={`text-xs mt-2 ${stats.incomeChange >= 0 ? "text-success" : "text-destructive"}`}>
                    {stats.incomeChange >= 0 ? "+" : ""}{stats.incomeChange.toFixed(1)}% față de luna trecută
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Cheltuieli luna curentă</p>
                      <p className="text-2xl font-bold text-destructive">{stats.currentExpense.toFixed(2)} RON</p>
                    </div>
                    <TrendingDown className={`h-8 w-8 ${stats.expenseChange <= 0 ? "text-success" : "text-destructive"}`} />
                  </div>
                  <p className={`text-xs mt-2 ${stats.expenseChange <= 0 ? "text-success" : "text-destructive"}`}>
                    {stats.expenseChange >= 0 ? "+" : ""}{stats.expenseChange.toFixed(1)}% față de luna trecută
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Economii luna curentă</p>
                      <p className={`text-2xl font-bold ${stats.currentSavings >= 0 ? "text-success" : "text-destructive"}`}>
                        {stats.currentSavings.toFixed(2)} RON
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="income" name="Venituri" fill="hsl(142 76% 36%)" />
                  <Bar dataKey="expense" name="Cheltuieli" fill="hsl(0 84% 60%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="yearly" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="income" name="Venituri" fill="hsl(142 76% 36%)" />
                  <Bar dataKey="expense" name="Cheltuieli" fill="hsl(0 84% 60%)" />
                  <Bar dataKey="savings" name="Economii" fill="hsl(210 100% 50%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="trends" className="space-y-4">
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Evoluția economiilor (ultimele 6 luni)</h4>
              <p className="text-xs text-muted-foreground">
                Graficul arată tendința economiilor tale în ultimele luni
              </p>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={savingsTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="savings" 
                    name="Economii" 
                    stroke="hsl(210 100% 50%)" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(210 100% 50%)", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
