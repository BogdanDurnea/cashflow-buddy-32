import { useState, useEffect, useMemo } from "react";
import { TransactionForm, Transaction } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { StatsCards } from "@/components/StatsCards";
import { TransactionFilters } from "@/components/TransactionFilters";
import { TransactionCharts } from "@/components/TransactionCharts";
import { BudgetManager } from "@/components/BudgetManager";
import { ReportsSection } from "@/components/ReportsSection";
import { ExportData } from "@/components/ExportData";
import { RecurringTransactions, RecurringTransaction } from "@/components/RecurringTransactions";
import { toast } from "sonner";
import heroImage from "@/assets/hero-dashboard.jpg";
import { PieChart, BarChart3, TrendingUp } from "lucide-react";

const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("transactions");
    if (saved) {
      return JSON.parse(saved, (key, value) => {
        if (key === "date") return new Date(value);
        return value;
      });
    }
    return [
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
    ];
  });

  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>(() => {
    const saved = localStorage.getItem("recurringTransactions");
    return saved ? JSON.parse(saved, (key, value) => {
      if (key === "nextDate") return new Date(value);
      return value;
    }) : [];
  });

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Filter states
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");

  // Save transactions to localStorage
  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  // Save recurring transactions to localStorage
  useEffect(() => {
    localStorage.setItem("recurringTransactions", JSON.stringify(recurringTransactions));
  }, [recurringTransactions]);

  // Check and process recurring transactions
  useEffect(() => {
    const checkRecurring = () => {
      const now = new Date();
      const updated: RecurringTransaction[] = [];
      let hasNewTransactions = false;

      recurringTransactions.forEach(recurring => {
        if (!recurring.isActive) {
          updated.push(recurring);
          return;
        }

        const nextDate = new Date(recurring.nextDate);
        if (nextDate <= now) {
          // Add transaction
          const newTransaction: Transaction = {
            id: Date.now().toString() + Math.random().toString(),
            type: recurring.type,
            amount: recurring.amount,
            category: recurring.category,
            description: recurring.description + " (Recurent)",
            date: new Date(),
          };
          
          setTransactions(prev => [newTransaction, ...prev]);
          hasNewTransactions = true;

          // Calculate next date
          const newNextDate = new Date(nextDate);
          if (recurring.frequency === "daily") {
            newNextDate.setDate(newNextDate.getDate() + 1);
          } else if (recurring.frequency === "weekly") {
            newNextDate.setDate(newNextDate.getDate() + 7);
          } else if (recurring.frequency === "monthly") {
            newNextDate.setMonth(newNextDate.getMonth() + 1);
          }

          updated.push({
            ...recurring,
            nextDate: newNextDate,
          });
        } else {
          updated.push(recurring);
        }
      });

      if (hasNewTransactions) {
        setRecurringTransactions(updated);
        toast.success("Tranzacții recurente procesate!");
      }
    };

    // Check every minute
    const interval = setInterval(checkRecurring, 60000);
    checkRecurring(); // Check immediately on mount

    return () => clearInterval(interval);
  }, [recurringTransactions]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Filter by type
      if (filterType !== "all" && transaction.type !== filterType) {
        return false;
      }

      // Filter by category
      if (filterCategory !== "all" && transaction.category !== filterCategory) {
        return false;
      }

      // Filter by period
      if (filterPeriod !== "all") {
        const now = new Date();
        const transactionDate = new Date(transaction.date);
        
        switch (filterPeriod) {
          case "today":
            if (transactionDate.toDateString() !== now.toDateString()) return false;
            break;
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (transactionDate < weekAgo) return false;
            break;
          case "month":
            if (transactionDate.getMonth() !== now.getMonth() || 
                transactionDate.getFullYear() !== now.getFullYear()) return false;
            break;
          case "3months":
            const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            if (transactionDate < threeMonthsAgo) return false;
            break;
          case "year":
            if (transactionDate.getFullYear() !== now.getFullYear()) return false;
            break;
        }
      }

      return true;
    });
  }, [transactions, filterType, filterCategory, filterPeriod]);

  const resetFilters = () => {
    setFilterType("all");
    setFilterCategory("all");
    setFilterPeriod("all");
  };

  const handleAddTransaction = (newTransaction: Omit<Transaction, "id">) => {
    const transaction = {
      ...newTransaction,
      id: Date.now().toString()
    };
    setTransactions(prev => [transaction, ...prev]);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowEditDialog(true);
  };

  const handleUpdateTransaction = (updatedTransaction: Transaction) => {
    setTransactions(prev => 
      prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
    );
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleAddRecurring = (recurring: Omit<RecurringTransaction, "id" | "nextDate" | "isActive">) => {
    const newRecurring: RecurringTransaction = {
      ...recurring,
      id: Date.now().toString(),
      nextDate: new Date(),
      isActive: true,
    };
    setRecurringTransactions([...recurringTransactions, newRecurring]);
  };

  const handleDeleteRecurring = (id: string) => {
    setRecurringTransactions(recurringTransactions.filter(r => r.id !== id));
    toast.success("Tranzacție recurentă ștearsă!");
  };

  const handleToggleRecurring = (id: string) => {
    setRecurringTransactions(
      recurringTransactions.map(r =>
        r.id === id ? { ...r, isActive: !r.isActive } : r
      )
    );
    toast.success("Stare tranzacție recurentă actualizată!");
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Section */}
        <StatsCards transactions={transactions} />

        {/* Budget, Recurring and Export Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <BudgetManager transactions={transactions} />
          <RecurringTransactions
            recurringTransactions={recurringTransactions}
            onAddRecurring={handleAddRecurring}
            onDeleteRecurring={handleDeleteRecurring}
            onToggleRecurring={handleToggleRecurring}
          />
          <ExportData transactions={transactions} />
        </div>

        {/* Filters Section */}
        <TransactionFilters
          selectedType={filterType}
          selectedCategory={filterCategory}
          selectedPeriod={filterPeriod}
          onTypeChange={setFilterType}
          onCategoryChange={setFilterCategory}
          onPeriodChange={setFilterPeriod}
          onReset={resetFilters}
        />

        {/* Charts Section */}
        <TransactionCharts transactions={filteredTransactions} />

        {/* Reports Section */}
        <ReportsSection transactions={transactions} />

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Transaction Form */}
          <div className="lg:col-span-1">
            <TransactionForm onAddTransaction={handleAddTransaction} />
          </div>

          {/* Transaction List */}
          <div className="lg:col-span-2">
            <TransactionList 
              transactions={filteredTransactions} 
              onEditTransaction={handleEditTransaction}
            />
          </div>
        </div>
      </main>

      {/* Edit Transaction Dialog */}
      <EditTransactionDialog
        transaction={editingTransaction}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={handleUpdateTransaction}
        onDelete={handleDeleteTransaction}
      />

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