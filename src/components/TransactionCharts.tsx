import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "./TransactionForm";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { getCategoryConfig } from "@/lib/categoryConfig";
import { BalanceEvolutionChart } from "./BalanceEvolutionChart";
import { motion } from "framer-motion";

interface TransactionChartsProps {
  transactions: Transaction[];
}

export function TransactionCharts({ transactions }: TransactionChartsProps) {
  // Prepare data for expense pie chart
  const expensesByCategory = transactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const expensePieData = Object.entries(expensesByCategory).map(([category, amount]) => {
    const config = getCategoryConfig(category, "expense");
    return {
      name: category,
      value: amount,
      color: config.color
    };
  }).sort((a, b) => b.value - a.value);

  // Prepare data for income pie chart
  const incomeByCategory = transactions
    .filter(t => t.type === "income")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const incomePieData = Object.entries(incomeByCategory).map(([category, amount]) => {
    const config = getCategoryConfig(category, "income");
    return {
      name: category,
      value: amount,
      color: config.color
    };
  }).sort((a, b) => b.value - a.value);

  // Prepare data for monthly bar chart
  const monthlyData = transactions.reduce((acc, t) => {
    const monthKey = new Date(t.date).toLocaleDateString('ro-RO', { month: 'short', year: 'numeric' });
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthKey, income: 0, expense: 0 };
    }
    if (t.type === "income") {
      acc[monthKey].income += t.amount;
    } else {
      acc[monthKey].expense += t.amount;
    }
    return acc;
  }, {} as Record<string, { month: string; income: number; expense: number }>);

  const barData = Object.values(monthlyData).sort((a, b) => {
    const dateA = new Date(a.month);
    const dateB = new Date(b.month);
    return dateA.getTime() - dateB.getTime();
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
      maximumFractionDigits: 0
    }).format(value);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.15,
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    })
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Balance Evolution Chart */}
      <motion.div 
        className="md:col-span-2"
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <BalanceEvolutionChart transactions={transactions} />
      </motion.div>

      {/* Expenses by Category */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <Card className="shadow-card h-full">
          <CardHeader>
            <CardTitle className="text-lg">Cheltuieli pe categorii</CardTitle>
          </CardHeader>
          <CardContent>
            {expensePieData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                Nu există cheltuieli înregistrate
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expensePieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expensePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Income by Category */}
      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <Card className="shadow-card h-full">
          <CardHeader>
            <CardTitle className="text-lg">Venituri pe categorii</CardTitle>
          </CardHeader>
          <CardContent>
            {incomePieData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                Nu există venituri înregistrate
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={incomePieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {incomePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Monthly Comparison Bar Chart */}
      <motion.div
        className="md:col-span-2"
        custom={3}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Comparație lunară: Venituri vs Cheltuieli</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                Nu există date pentru afișare
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="income" name="Venituri" fill="hsl(142 76% 36%)" />
                  <Bar dataKey="expense" name="Cheltuieli" fill="hsl(0 84% 60%)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
