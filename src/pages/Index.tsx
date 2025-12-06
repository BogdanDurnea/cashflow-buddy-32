import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
import { AccountSettings } from "@/components/AccountSettings";
import { ImportData } from "@/components/ImportData";
import { ShareReport } from "@/components/ShareReport";
import { ShareReportPublic } from "@/components/ShareReportPublic";
import { SharedBudgetsManager } from "@/components/SharedBudgetsManager";
import { AIInsights } from "@/components/AIInsights";
import { ZapierIntegration } from "@/components/ZapierIntegration";
import { APIExport } from "@/components/APIExport";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationSettings } from "@/components/NotificationSettings";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";
import { useBudgetAlerts } from "@/hooks/useBudgetAlerts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PieChart, BarChart3, TrendingUp, LogOut, Loader2, Bell, ChevronsUpDown, TrendingDown } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const
    }
  }
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3, ease: "easeOut" as const }
};

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
  const [activeSection, setActiveSection] = useState<string>("transactions");
  const [expandedSections, setExpandedSections] = useState<string[]>(["transactions"]);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const allSections = ["transactions", "analytics", "budgets", "reports", "settings"];

  const toggleAllSections = useCallback(() => {
    if (expandedSections.length === allSections.length) {
      setExpandedSections([]);
    } else {
      setExpandedSections(allSections);
    }
  }, [expandedSections.length]);

  // Smooth scroll to section when opened
  const handleAccordionChange = useCallback((values: string[]) => {
    const newlyOpened = values.find(v => !expandedSections.includes(v));
    setExpandedSections(values);
    
    if (newlyOpened && sectionRefs.current[newlyOpened]) {
      setTimeout(() => {
        sectionRefs.current[newlyOpened]?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  }, [expandedSections]);

  // Budget alerts hook
  const { requestNotificationPermission } = useBudgetAlerts({
    transactions,
    monthlyBudget,
    categoryBudgets
  });

  // Sparkline data for current month
  const monthlySparklineData = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return daysInMonth.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayExpenses = transactions
        .filter(t => t.type === 'expense' && format(new Date(t.date), 'yyyy-MM-dd') === dayStr)
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        day: format(day, 'd'),
        amount: dayExpenses,
      };
    });
  }, [transactions]);

  const monthlyTotal = useMemo(() => 
    monthlySparklineData.reduce((sum, d) => sum + d.amount, 0),
    [monthlySparklineData]
  );

  const currentMonthName = format(new Date(), 'MMMM');

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
    <div className="flex min-h-screen w-full bg-gradient-subtle">
      <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <div className="flex-1 flex flex-col w-full">
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-sm border-b shadow-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <SidebarTrigger className="shrink-0" />
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
                onClick={toggleAllSections}
                className="h-8 sm:h-9 active:scale-95 transition-smooth"
                title={expandedSections.length === allSections.length ? "Închide toate secțiunile" : "Deschide toate secțiunile"}
              >
                <ChevronsUpDown className="h-4 w-4" />
                <span className="hidden md:inline ml-1">
                  {expandedSections.length === allSections.length ? "Închide tot" : "Deschide tot"}
                </span>
              </Button>
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
        <section className="relative py-6 sm:py-8 md:py-10 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 border-b">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6">
              {/* Left: Greeting */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                  <div className="relative p-3 sm:p-4 bg-gradient-primary rounded-2xl shadow-glow">
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Bună, {user?.email?.split('@')[0] || 'User'}! 👋
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Ai <span className="font-semibold text-primary">{transactions.length}</span> tranzacții înregistrate
                  </p>
                </div>
              </div>

              {/* Center: Monthly Sparkline */}
              <div className="flex-1 w-full lg:max-w-sm">
                <div className="p-3 rounded-xl bg-card/50 backdrop-blur border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground capitalize">Cheltuieli {currentMonthName}</span>
                    <div className="flex items-center gap-1 text-danger">
                      <TrendingDown className="h-3 w-3" />
                      <span className="text-xs font-semibold">{monthlyTotal.toLocaleString('ro-RO')} RON</span>
                    </div>
                  </div>
                  <div className="h-12">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlySparklineData}>
                        <defs>
                          <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--danger))" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(var(--danger))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Tooltip 
                          contentStyle={{ 
                            background: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                          formatter={(value: number) => [`${value.toLocaleString('ro-RO')} RON`, 'Cheltuieli']}
                          labelFormatter={(label) => `Ziua ${label}`}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="hsl(var(--danger))" 
                          strokeWidth={2}
                          fill="url(#sparklineGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Income, Expense & Balance Cards */}
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                {/* Income Card */}
                <div className="flex-1 p-4 rounded-xl bg-success/10 border border-success/30 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-success/20">
                      <TrendingUp className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-xs text-success/80 font-medium">Venituri</p>
                      <p className="text-xl font-bold text-success">
                        +{transactions
                          .filter(t => t.type === 'income' && new Date(t.date).getMonth() === new Date().getMonth() && new Date(t.date).getFullYear() === new Date().getFullYear())
                          .reduce((sum, t) => sum + Number(t.amount), 0)
                          .toLocaleString('ro-RO')} RON
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expense Card */}
                <div className="flex-1 p-4 rounded-xl bg-danger/10 border border-danger/30 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-danger/20">
                      <TrendingDown className="h-5 w-5 text-danger" />
                    </div>
                    <div>
                      <p className="text-xs text-danger/80 font-medium">Cheltuieli</p>
                      <p className="text-xl font-bold text-danger">
                        -{monthlyTotal.toLocaleString('ro-RO')} RON
                      </p>
                    </div>
                  </div>
                </div>

                {/* Net Balance Card */}
                {(() => {
                  const monthlyIncome = transactions
                    .filter(t => t.type === 'income' && new Date(t.date).getMonth() === new Date().getMonth() && new Date(t.date).getFullYear() === new Date().getFullYear())
                    .reduce((sum, t) => sum + Number(t.amount), 0);
                  const netBalance = monthlyIncome - monthlyTotal;
                  const isPositive = netBalance >= 0;
                  return (
                    <div className={`flex-1 p-4 rounded-xl backdrop-blur ${isPositive ? 'bg-primary/10 border border-primary/30' : 'bg-warning/10 border border-warning/30'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${isPositive ? 'bg-primary/20' : 'bg-warning/20'}`}>
                          <BarChart3 className={`h-5 w-5 ${isPositive ? 'text-primary' : 'text-warning'}`} />
                        </div>
                        <div>
                          <p className={`text-xs font-medium ${isPositive ? 'text-primary/80' : 'text-warning/80'}`}>Balanță netă</p>
                          <p className={`text-xl font-bold ${isPositive ? 'text-primary' : 'text-warning'}`}>
                            {isPositive ? '+' : ''}{netBalance.toLocaleString('ro-RO')} RON
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <motion.main 
          className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 space-y-2"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <Accordion 
            type="multiple" 
            value={expandedSections}
            onValueChange={handleAccordionChange}
            className="space-y-4"
          >
            {/* Transactions Section */}
            <motion.div variants={itemVariants}>
              <AccordionItem 
                value="transactions" 
                id="section-transactions" 
                className="border rounded-lg bg-card shadow-card transition-all duration-300 data-[state=open]:shadow-lg data-[state=open]:border-primary/20"
                ref={(el) => { sectionRefs.current['transactions'] = el; }}
              >
              <AccordionTrigger className="px-4 sm:px-6 py-4 text-lg sm:text-xl font-bold hover:no-underline">
                Tranzacții
              </AccordionTrigger>
              <AccordionContent className="px-4 sm:px-6 pb-4 space-y-6">
                <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-1">
                    <TransactionForm onAddTransaction={handleAddTransaction} />
                  </div>
                  <div className="lg:col-span-2">
                    <TransactionList 
                      transactions={filteredTransactions} 
                      onEditTransaction={handleEditTransaction}
                    />
                  </div>
                </div>
                <StatsCards transactions={transactions} />
                <TransactionFilters
                  selectedType={filterType}
                  selectedCategory={filterCategory}
                  selectedPeriod={filterPeriod}
                  onTypeChange={setFilterType}
                  onCategoryChange={setFilterCategory}
                  onPeriodChange={setFilterPeriod}
                  onReset={resetFilters}
                />
              </AccordionContent>
              </AccordionItem>
            </motion.div>

            {/* Analytics Section */}
            <motion.div variants={itemVariants}>
              <AccordionItem 
                value="analytics" 
                id="section-analytics" 
                className="border rounded-lg bg-card shadow-card transition-all duration-300 data-[state=open]:shadow-lg data-[state=open]:border-primary/20"
                ref={(el) => { sectionRefs.current['analytics'] = el; }}
              >
              <AccordionTrigger className="px-4 sm:px-6 py-4 text-lg sm:text-xl font-bold hover:no-underline">
                Analiză Avansată
              </AccordionTrigger>
              <AccordionContent className="px-4 sm:px-6 pb-4 space-y-6">
                <DateRangeFilter onDateRangeChange={handleDateRangeChange} />
                <AIInsights 
                  transactions={transactions}
                  categoryBudgets={Object.fromEntries(categoryBudgets.map(b => [b.category, b.limit]))}
                  monthlyBudget={monthlyBudget}
                />
                <BudgetVsActualChart 
                  transactions={transactions} 
                  categoryBudgets={categoryBudgets}
                />
                <CategoryTrendChart transactions={filteredTransactions} />
                <TransactionCharts transactions={filteredTransactions} />
              </AccordionContent>
              </AccordionItem>
            </motion.div>

            {/* Budgets Section */}
            <motion.div variants={itemVariants}>
              <AccordionItem 
                value="budgets" 
                id="section-budgets" 
                className="border rounded-lg bg-card shadow-card transition-all duration-300 data-[state=open]:shadow-lg data-[state=open]:border-primary/20"
                ref={(el) => { sectionRefs.current['budgets'] = el; }}
              >
                <AccordionTrigger className="px-4 sm:px-6 py-4 text-lg sm:text-xl font-bold hover:no-underline">
                  Bugete
                </AccordionTrigger>
                <AccordionContent className="px-4 sm:px-6 pb-4 space-y-6">
                  <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                    <BudgetManager transactions={transactions} userId={user!.id} />
                    <CategoryBudgets transactions={transactions} />
                  </div>
                  <SharedBudgetsManager />
                </AccordionContent>
              </AccordionItem>
            </motion.div>

            {/* Reports Section */}
            <motion.div variants={itemVariants}>
              <AccordionItem 
                value="reports" 
                id="section-reports" 
                className="border rounded-lg bg-card shadow-card transition-all duration-300 data-[state=open]:shadow-lg data-[state=open]:border-primary/20"
                ref={(el) => { sectionRefs.current['reports'] = el; }}
              >
                <AccordionTrigger className="px-4 sm:px-6 py-4 text-lg sm:text-xl font-bold hover:no-underline">
                  Rapoarte & Integrări
                </AccordionTrigger>
                <AccordionContent className="px-4 sm:px-6 pb-4 space-y-6">
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
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Integrări</h3>
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
                  </div>
                </AccordionContent>
              </AccordionItem>
            </motion.div>

            {/* Settings Section */}
            <motion.div variants={itemVariants}>
              <AccordionItem 
                value="settings" 
                id="section-settings" 
                className="border rounded-lg bg-card shadow-card transition-all duration-300 data-[state=open]:shadow-lg data-[state=open]:border-primary/20"
                ref={(el) => { sectionRefs.current['settings'] = el; }}
              >
                <AccordionTrigger className="px-4 sm:px-6 py-4 text-lg sm:text-xl font-bold hover:no-underline">
                  Setări
                </AccordionTrigger>
                <AccordionContent className="px-4 sm:px-6 pb-4 space-y-6">
                  <NotificationSettings />
                  <CustomCategoriesManager />
                  <AccountSettings />
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
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          </Accordion>
        </motion.main>

        {/* Edit Transaction Dialog */}
        <EditTransactionDialog
          transaction={editingTransaction}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSave={handleUpdateTransaction}
          onDelete={handleDeleteTransaction}
        />

        {/* Footer */}
        <footer className="bg-card border-t mt-8 sm:mt-12">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
            <div className="text-center text-muted-foreground">
              <p className="text-xs sm:text-sm">&copy; 2024 MoneyTracker. O aplicație pentru gestionarea finanțelor personale.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
