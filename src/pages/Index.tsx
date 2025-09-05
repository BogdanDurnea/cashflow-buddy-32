import { useState } from "react";
import { TransactionForm, Transaction } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { StatsCards } from "@/components/StatsCards";
import heroImage from "@/assets/hero-dashboard.jpg";
import { PieChart, BarChart3, TrendingUp } from "lucide-react";

const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: "1",
      type: "income",
      amount: 3500,
      category: "Salariu",
      description: "Salariu lunar",
      date: new Date(2024, 11, 1)
    },
    {
      id: "2", 
      type: "expense",
      amount: 1200,
      category: "Închiriere",
      description: "Chirie apartament",
      date: new Date(2024, 11, 3)
    },
    {
      id: "3",
      type: "expense", 
      amount: 350,
      category: "Mâncare",
      description: "Cumpărături săptămânale",
      date: new Date(2024, 11, 5)
    }
  ]);

  const handleAddTransaction = (newTransaction: Omit<Transaction, "id">) => {
    const transaction = {
      ...newTransaction,
      id: Date.now().toString()
    };
    setTransactions(prev => [transaction, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b shadow-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="gradient-primary p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">MoneyTracker</h1>
                <p className="text-sm text-muted-foreground">Monitorizează-ți finanțele</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <PieChart className="h-5 w-5 text-primary" />
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-90"></div>
        <div 
          className="h-48 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-primary-foreground">
            <h2 className="text-4xl font-bold mb-2">Controlează-ți finanțele</h2>
            <p className="text-xl opacity-90">Monitorizează venituri și cheltuieli cu ușurință</p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Section */}
        <div className="mb-8">
          <StatsCards transactions={transactions} />
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Transaction Form */}
          <div className="lg:col-span-1">
            <TransactionForm onAddTransaction={handleAddTransaction} />
          </div>

          {/* Transaction List */}
          <div className="lg:col-span-2">
            <TransactionList transactions={transactions} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 MoneyTracker. O aplicație pentru gestionarea finanțelor personale.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;