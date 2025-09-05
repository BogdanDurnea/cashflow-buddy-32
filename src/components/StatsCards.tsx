import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, Target } from "lucide-react";
import { Transaction } from "./TransactionForm";

interface StatsCardsProps {
  transactions: Transaction[];
}

export function StatsCards({ transactions }: StatsCardsProps) {
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON'
    }).format(amount);
  };

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === thisMonth && 
           transactionDate.getFullYear() === thisYear;
  });

  const monthlyBalance = monthlyTransactions
    .reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-card hover:shadow-success transition-smooth">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Venituri totale</CardTitle>
          <div className="p-2 bg-success-light rounded-lg">
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{formatAmount(totalIncome)}</div>
          <p className="text-xs text-muted-foreground">
            Toate veniturile înregistrate
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card hover:shadow-danger transition-smooth">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cheltuieli totale</CardTitle>
          <div className="p-2 bg-danger-light rounded-lg">
            <TrendingDown className="h-4 w-4 text-danger" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-danger">{formatAmount(totalExpenses)}</div>
          <p className="text-xs text-muted-foreground">
            Toate cheltuielile înregistrate
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Balanța generală</CardTitle>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Wallet className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            balance >= 0 ? "text-success" : "text-danger"
          }`}>
            {formatAmount(balance)}
          </div>
          <p className="text-xs text-muted-foreground">
            Diferența dintre venituri și cheltuieli
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Luna curentă</CardTitle>
          <div className="p-2 bg-warning-light rounded-lg">
            <Target className="h-4 w-4 text-warning" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            monthlyBalance >= 0 ? "text-success" : "text-danger"
          }`}>
            {formatAmount(monthlyBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            Balanța pentru {new Date().toLocaleDateString('ro-RO', { month: 'long' })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}