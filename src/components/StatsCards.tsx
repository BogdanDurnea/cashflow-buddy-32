import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Activity, Calendar, PiggyBank } from "lucide-react";
import { Transaction } from "@/components/TransactionForm";

interface StatsCardsProps {
  transactions: Transaction[];
}

export function StatsCards({ transactions }: StatsCardsProps) {
  // Calculate statistics
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Current month calculations
  const now = new Date();
  const currentMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = currentMonthTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Daily average (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
  const recentExpenses = recentTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const dailyAverage = recentExpenses / 30;

  // Savings rate
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100 : 0;

  // Projection for end of month
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projectedExpenses = (monthlyExpense / dayOfMonth) * daysInMonth;

  const stats = [
    {
      title: "Sold Total",
      value: `${balance.toFixed(2)} RON`,
      icon: DollarSign,
      trend: balance >= 0 ? "positive" : "negative",
      description: `${totalIncome.toFixed(2)} venituri - ${totalExpense.toFixed(2)} cheltuieli`,
    },
    {
      title: "Luna Curentă",
      value: `${(monthlyIncome - monthlyExpense).toFixed(2)} RON`,
      icon: Calendar,
      trend: (monthlyIncome - monthlyExpense) >= 0 ? "positive" : "negative",
      description: `${monthlyIncome.toFixed(2)} venituri - ${monthlyExpense.toFixed(2)} cheltuieli`,
    },
    {
      title: "Medie Zilnică",
      value: `${dailyAverage.toFixed(2)} RON`,
      icon: Activity,
      trend: "neutral",
      description: "Cheltuieli medii (ultimele 30 zile)",
    },
    {
      title: "Rată de Economisire",
      value: `${savingsRate.toFixed(1)}%`,
      icon: PiggyBank,
      trend: savingsRate >= 20 ? "positive" : savingsRate >= 10 ? "neutral" : "negative",
      description: monthlyIncome > 0 ? `Din venitul lunar` : "Fără venituri înregistrate",
    },
    {
      title: "Proiecție Lunară",
      value: `${projectedExpenses.toFixed(2)} RON`,
      icon: TrendingUp,
      trend: projectedExpenses <= monthlyIncome ? "positive" : "negative",
      description: `Estimare cheltuieli până la ${daysInMonth} ${now.toLocaleDateString('ro-RO', { month: 'long' })}`,
    },
    {
      title: "Cea mai Mare Cheltuială",
      value: transactions.filter(t => t.type === "expense").length > 0
        ? `${Math.max(...transactions.filter(t => t.type === "expense").map(t => t.amount)).toFixed(2)} RON`
        : "0.00 RON",
      icon: TrendingDown,
      trend: "neutral",
      description: currentMonthTransactions.filter(t => t.type === "expense").length > 0
        ? `Luna curentă: ${Math.max(...currentMonthTransactions.filter(t => t.type === "expense").map(t => t.amount), 0).toFixed(2)} RON`
        : "Nicio cheltuială în luna curentă",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index} 
            className="shadow-card transition-smooth hover:shadow-lg active:scale-[0.98] animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <div className={`text-xl sm:text-2xl font-bold break-words ${
                stat.trend === "positive" ? "text-success" :
                stat.trend === "negative" ? "text-danger" :
                "text-foreground"
              }`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
