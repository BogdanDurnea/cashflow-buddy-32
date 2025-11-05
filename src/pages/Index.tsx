import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TransactionForm, Transaction } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";
import { StatsCards } from "@/components/StatsCards";
import { TransactionFilters } from "@/components/TransactionFilters";
import { TransactionCharts } from "@/components/TransactionCharts";
import { BudgetManager } from "@/components/BudgetManager";
import { CategoryBudgets } from "@/components/CategoryBudgets";
import { ReportsSection } from "@/components/ReportsSection";
import { ExportData } from "@/components/ExportData";
import { RecurringTransactions, RecurringTransaction } from "@/components/RecurringTransactions";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { BudgetVsActualChart } from "@/components/BudgetVsActualChart";
import { CategoryTrendChart } from "@/components/CategoryTrendChart";
import { CustomCategoriesManager } from "@/components/CustomCategoriesManager";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserSettings } from "@/components/UserSettings";
import { ImportData } from "@/components/ImportData";
import { ShareReport } from "@/components/ShareReport";
import { ShareReportPublic } from "@/components/ShareReportPublic";
import { SharedBudgetsManager } from "@/components/SharedBudgetsManager";
import { AIInsights } from "@/components/AIInsights";
import { ZapierIntegration } from "@/components/ZapierIntegration";
import { APIExport } from "@/components/APIExport";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { NotificationSettings } from "@/components/NotificationSettings";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBudgetAlerts } from "@/hooks/useBudgetAlerts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import heroImage from "@/assets/hero-dashboard.jpg";
import { PieChart, BarChart3, TrendingUp, LogOut, Loader2, Bell } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");
  const [dateRangeStart, setDateRangeStart] = useState<Date | null>(null);
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | null>(null);
  const [categoryBudgets, setCategoryBudgets] = useState<Array<{ category: string; limit: number }>>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(5000);
  const [activeTab, setActiveTab] = useState<string>("transactions");

  // Budget alerts hook
  const { requestNotificationPermission } = useBudgetAlerts({
    transactions,
    monthlyBudget,
    categoryBudgets
  });

  // Load category budgets from localStorage
  useEffect(() => {
    const savedBudgets = localStorage.getItem("categoryBudgets");
    if (savedBudgets) {
      setCategoryBudgets(JSON.parse(savedBudgets));
    }
  }, []);

  // Load monthly budget from database
  useEffect(() => {
    if (!user) return;

    const loadMonthlyBudget = async () => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const { data } = await supabase
        .from("budgets")
        .select("amount")
        .eq("user_id", user.id)
        .eq("month", month)
        .eq("year", year)
        .single();

      if (data) {
        setMonthlyBudget(Number(data.amount));
      }
    };

    loadMonthlyBudget();
  }, [user]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Load transactions from database
  useEffect(() => {
    if (!user) return;

    const loadTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });

        if (error) throw error;

        const formattedTransactions = data.map(t => ({
          id: t.id,
          type: t.type as "income" | "expense",
          amount: Number(t.amount),
          category: t.category,
          description: t.description || "",
          date: new Date(t.date),
          currency: t.currency || 'RON',
          exchange_rate: Number(t.exchange_rate) || 1,
          attachment_url: t.attachment_url || undefined,
        }));

        setTransactions(formattedTransactions);
      } catch (error: any) {
        toast.error("Eroare la încărcarea tranzacțiilor");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [user]);

  // Load recurring transactions from database
  useEffect(() => {
    if (!user) return;

    const loadRecurring = async () => {
      try {
        const { data, error } = await supabase
          .from("recurring_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const formattedRecurring = data.map(r => ({
          id: r.id,
          type: r.type as "income" | "expense",
          amount: Number(r.amount),
          category: r.category,
          description: r.description || "",
          frequency: r.frequency as "daily" | "weekly" | "monthly",
          isActive: r.is_active,
          nextDate: r.last_processed ? new Date(r.last_processed) : new Date(),
        }));

        setRecurringTransactions(formattedRecurring);
      } catch (error: any) {
        toast.error("Eroare la încărcarea tranzacțiilor recurente");
        console.error(error);
      }
    };

    loadRecurring();
  }, [user]);

  // Handle date range change
  const handleDateRangeChange = (startDate: Date | null, endDate: Date | null) => {
    setDateRangeStart(startDate);
    setDateRangeEnd(endDate);
  };

  // Apply filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      if (filterType !== "all" && transaction.type !== filterType) return false;
      if (filterCategory !== "all" && transaction.category !== filterCategory) return false;

      // Date range filter takes precedence over period filter
      if (dateRangeStart && dateRangeEnd) {
        const transactionDate = new Date(transaction.date);
        if (transactionDate < dateRangeStart || transactionDate > dateRangeEnd) return false;
      } else if (filterPeriod !== "all") {
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
  }, [transactions, filterType, filterCategory, filterPeriod, dateRangeStart, dateRangeEnd]);

  const resetFilters = () => {
    setFilterType("all");
    setFilterCategory("all");
    setFilterPeriod("all");
    setDateRangeStart(null);
    setDateRangeEnd(null);
  };

  const handleAddTransaction = async (newTransaction: Omit<Transaction, "id">) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("transactions")
        .insert([{
          user_id: user.id,
          type: newTransaction.type,
          amount: newTransaction.amount,
          category: newTransaction.category,
          description: newTransaction.description,
          date: newTransaction.date.toISOString().split('T')[0],
          currency: newTransaction.currency || 'RON',
          exchange_rate: newTransaction.exchange_rate || 1,
          attachment_url: newTransaction.attachment_url || null,
        }])
        .select()
        .single();

      if (error) throw error;

      const formattedTransaction: Transaction = {
        id: data.id,
        type: data.type as "income" | "expense",
        amount: Number(data.amount),
        category: data.category,
        description: data.description || "",
        date: new Date(data.date),
        currency: data.currency || 'RON',
        exchange_rate: Number(data.exchange_rate) || 1,
        attachment_url: data.attachment_url || undefined,
      };

      setTransactions(prev => [formattedTransaction, ...prev]);
      toast.success("Tranzacție adăugată!");
    } catch (error: any) {
      toast.error("Eroare la adăugarea tranzacției");
      console.error(error);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowEditDialog(true);
  };

  const handleUpdateTransaction = async (updatedTransaction: Transaction) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          type: updatedTransaction.type,
          amount: updatedTransaction.amount,
          category: updatedTransaction.category,
          description: updatedTransaction.description,
          date: updatedTransaction.date.toISOString().split('T')[0],
          currency: updatedTransaction.currency || 'RON',
          exchange_rate: updatedTransaction.exchange_rate || 1,
          attachment_url: updatedTransaction.attachment_url || null,
        })
        .eq("id", updatedTransaction.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setTransactions(prev => 
        prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
      );
      toast.success("Tranzacție actualizată!");
    } catch (error: any) {
      toast.error("Eroare la actualizarea tranzacției");
      console.error(error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success("Tranzacție ștearsă!");
    } catch (error: any) {
      toast.error("Eroare la ștergerea tranzacției");
      console.error(error);
    }
  };

  const handleAddRecurring = async (recurring: Omit<RecurringTransaction, "id" | "nextDate" | "isActive">) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("recurring_transactions")
        .insert([{
          user_id: user.id,
          type: recurring.type,
          amount: recurring.amount,
          category: recurring.category,
          description: recurring.description,
          frequency: recurring.frequency,
          is_active: true,
          last_processed: new Date().toISOString().split('T')[0],
        }])
        .select()
        .single();

      if (error) throw error;

      const newRecurring: RecurringTransaction = {
        id: data.id,
        type: data.type as "income" | "expense",
        amount: Number(data.amount),
        category: data.category,
        description: data.description || "",
        frequency: data.frequency as "daily" | "weekly" | "monthly",
        isActive: data.is_active,
        nextDate: new Date(data.last_processed),
      };

      setRecurringTransactions([...recurringTransactions, newRecurring]);
      toast.success("Tranzacție recurentă adăugată!");
    } catch (error: any) {
      toast.error("Eroare la adăugarea tranzacției recurente");
      console.error(error);
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("recurring_transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setRecurringTransactions(recurringTransactions.filter(r => r.id !== id));
      toast.success("Tranzacție recurentă ștearsă!");
    } catch (error: any) {
      toast.error("Eroare la ștergerea tranzacției recurente");
      console.error(error);
    }
  };

  const handleToggleRecurring = async (id: string) => {
    if (!user) return;

    const recurring = recurringTransactions.find(r => r.id === id);
    if (!recurring) return;

    try {
      const { error } = await supabase
        .from("recurring_transactions")
        .update({ is_active: !recurring.isActive })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setRecurringTransactions(
        recurringTransactions.map(r =>
          r.id === id ? { ...r, isActive: !r.isActive } : r
        )
      );
      toast.success("Stare tranzacție recurentă actualizată!");
    } catch (error: any) {
      toast.error("Eroare la actualizarea stării");
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
    toast.success("Deconectat cu succes!");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b shadow-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="gradient-primary p-1.5 sm:p-2 rounded-lg shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">MoneyTracker</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Monitorizează-ți finanțele</p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              <div className="hidden md:flex items-center space-x-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <PieChart className="h-5 w-5 text-primary" />
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={requestNotificationPermission}
                className="h-8 sm:h-9 active:scale-95 transition-smooth"
                title="Activează notificările pentru alerte de buget"
              >
                <Bell className="h-4 w-4" />
              </Button>
              <ThemeToggle />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="h-8 sm:h-9 active:scale-95 transition-smooth"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Ieșire</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-90"></div>
        <div 
          className="h-32 sm:h-40 md:h-48 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="text-center text-primary-foreground max-w-3xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">Controlează-ți finanțele</h2>
            <p className="text-sm sm:text-base md:text-xl opacity-90">Monitorizează venituri și cheltuieli cu ușurință</p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 pb-20 md:pb-8 space-y-6 sm:space-y-8">
        {/* Transactions Tab Content */}
        {activeTab === "transactions" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
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

            {/* Stats Section */}
            <StatsCards transactions={transactions} />

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
          </div>
        )}

        {/* Analytics Tab Content */}
        {activeTab === "analytics" && (
          <section className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold">Analiză Avansată</h2>
            
            {/* Date Range Filter */}
            <DateRangeFilter onDateRangeChange={handleDateRangeChange} />
            
            {/* AI Insights Section */}
            <AIInsights 
              transactions={transactions}
              categoryBudgets={Object.fromEntries(categoryBudgets.map(b => [b.category, b.limit]))}
              monthlyBudget={monthlyBudget}
            />
            
            {/* Budget vs Actual */}
            <BudgetVsActualChart 
              transactions={transactions} 
              categoryBudgets={categoryBudgets}
            />
            
            {/* Category Trends */}
            <CategoryTrendChart transactions={filteredTransactions} />
            
            {/* Original Charts */}
            <TransactionCharts transactions={filteredTransactions} />
          </section>
        )}

        {/* Budgets Tab Content */}
        {activeTab === "budgets" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <BudgetManager transactions={transactions} userId={user!.id} />
              <CategoryBudgets transactions={transactions} />
            </div>

            <SharedBudgetsManager />
          </div>
        )}

        {/* Reports Tab Content */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <ReportsSection transactions={transactions} />
            
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <ExportData transactions={transactions} />
              <ShareReport transactions={transactions} />
            </div>

            <ShareReportPublic 
              reportData={{ 
                transactions: filteredTransactions,
                income: filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
                expenses: filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
              }}
              title="Raport Financiar MoneyTracker"
            />

            {/* Integrations Section */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold">Integrations</h2>
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                <ZapierIntegration 
                  transactions={transactions}
                  budgets={categoryBudgets.map(cb => ({
                    category: cb.category,
                    amount: cb.limit,
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear()
                  }))}
                />
                <APIExport 
                  transactions={transactions}
                  budgets={categoryBudgets.map(cb => ({
                    category: cb.category,
                    amount: cb.limit,
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear()
                  }))}
                />
              </div>
            </section>
          </div>
        )}

        {/* Settings Tab Content */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <NotificationSettings />
            
            <CustomCategoriesManager />

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <UserSettings />
              <ImportData onImport={(imported) => {
                imported.forEach(t => handleAddTransaction(t));
              }} />
            </div>

            <RecurringTransactions
              recurringTransactions={recurringTransactions}
              onAddRecurring={handleAddRecurring}
              onDeleteRecurring={handleDeleteRecurring}
              onToggleRecurring={handleToggleRecurring}
            />
          </div>
        )}
      </main>

      {/* Edit Transaction Dialog */}
      <EditTransactionDialog
        transaction={editingTransaction}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={handleUpdateTransaction}
        onDelete={handleDeleteTransaction}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Footer */}
      <footer className="bg-card border-t mt-8 sm:mt-12 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          <div className="text-center text-muted-foreground">
            <p className="text-xs sm:text-sm">&copy; 2024 MoneyTracker. O aplicație pentru gestionarea finanțelor personale.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
