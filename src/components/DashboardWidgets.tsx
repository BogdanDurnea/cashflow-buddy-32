import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Settings2, Target, PiggyBank, Clock } from "lucide-react";
import { Transaction } from "./TransactionForm";
import { QuickStatsDonut } from "./QuickStatsDonut";
import { BalanceEvolutionChart } from "./BalanceEvolutionChart";
import { SavingsGoal } from "@/hooks/useSavingsGoals";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getCategoryConfig } from "@/lib/categoryConfig";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

type WidgetId = "balance-evolution" | "category-donut" | "savings-goals" | "recent-transactions" | "budget-vs-actual";

interface WidgetConfig {
  id: WidgetId;
  label: string;
  visible: boolean;
}

const STORAGE_KEY = "dashboard-widgets-config";

const defaultWidgets: WidgetConfig[] = [
  { id: "balance-evolution", label: "Evoluție sold", visible: true },
  { id: "category-donut", label: "Cheltuieli pe categorii", visible: true },
  { id: "savings-goals", label: "Obiective de economii", visible: true },
  { id: "recent-transactions", label: "Tranzacții recente", visible: true },
  { id: "budget-vs-actual", label: "Buget vs Real", visible: true },
];

function loadConfig(): WidgetConfig[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as WidgetConfig[];
      const ids = new Set(parsed.map((w) => w.id));
      const merged = [
        ...parsed,
        ...defaultWidgets.filter((w) => !ids.has(w.id)),
      ];
      return merged;
    }
  } catch {}
  return defaultWidgets;
}

function saveConfig(config: WidgetConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

interface DashboardWidgetsProps {
  transactions: Transaction[];
  savingsGoals?: SavingsGoal[];
  categoryBudgets?: Array<{ category: string; limit: number }>;
}

// Mini savings goals widget
function SavingsGoalsWidget({ goals }: { goals: SavingsGoal[] }) {
  if (goals.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <PiggyBank className="h-5 w-5 text-primary" />
            Obiective de economii
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Niciun obiectiv de economii setat. Adaugă unul din secțiunea Planificare.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PiggyBank className="h-5 w-5 text-primary" />
          Obiective de economii
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence mode="popLayout">
          {goals.slice(0, 4).map((goal, i) => {
            const percentage = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            return (
              <motion.div
                key={goal.id}
                className="space-y-1.5"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate">{goal.name}</span>
                  <motion.span
                    key={percentage}
                    className="text-muted-foreground shrink-0 ml-2"
                    initial={{ scale: 1.3, color: "hsl(var(--primary))" }}
                    animate={{ scale: 1, color: "hsl(var(--muted-foreground))" }}
                    transition={{ duration: 0.4 }}
                  >
                    {percentage.toFixed(0)}%
                  </motion.span>
                </div>
                <Progress value={percentage} className="h-2 transition-all duration-500" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{goal.currentAmount.toLocaleString('ro-RO')} RON</span>
                  <span>{goal.targetAmount.toLocaleString('ro-RO')} RON</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {goals.length > 4 && (
          <p className="text-xs text-muted-foreground text-center">
            +{goals.length - 4} obiective
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Mini recent transactions widget
function RecentTransactionsWidget({ transactions }: { transactions: Transaction[] }) {
  const recent = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  if (recent.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            Tranzacții recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nicio tranzacție înregistrată.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Tranzacții recente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recent.map((tx) => {
          const config = getCategoryConfig(tx.category, tx.type);
          const IconComponent = config.icon;
          const isExpense = tx.type === "expense";
          return (
            <div key={tx.id} className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
              <div className="shrink-0 p-1.5 rounded-md" style={{ backgroundColor: config.lightColor }}>
                <IconComponent className="h-4 w-4" style={{ color: config.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {tx.description || tx.category}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(tx.date), "d MMM yyyy", { locale: ro })}
                </p>
              </div>
              <span className={`text-sm font-semibold shrink-0 ${isExpense ? "text-destructive" : "text-success"}`}>
                {isExpense ? "-" : "+"}{tx.amount.toLocaleString('ro-RO')} RON
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Mini budget vs actual widget
function BudgetVsActualWidget({ transactions, categoryBudgets }: { transactions: Transaction[]; categoryBudgets: Array<{ category: string; limit: number }> }) {
  const data = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const expenses = transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === "expense" && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return categoryBudgets
      .filter(b => b.limit > 0)
      .map(b => ({
        category: b.category,
        budget: b.limit,
        actual: expenses[b.category] || 0,
        percentage: ((expenses[b.category] || 0) / b.limit) * 100,
      }));
  }, [transactions, categoryBudgets]);

  if (data.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Buget vs Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Setează bugete pe categorii pentru a vedea comparația.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-primary" />
          Buget vs Real
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.slice(0, 5).map((item) => {
          const isOver = item.percentage > 100;
          const isNear = item.percentage > 80 && !isOver;
          return (
            <div key={item.category} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium truncate">{item.category}</span>
                <span className={`shrink-0 ml-2 font-semibold ${isOver ? "text-destructive" : isNear ? "text-warning" : "text-success"}`}>
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isOver ? "bg-destructive" : isNear ? "bg-warning" : "bg-primary"}`}
                  style={{ width: `${Math.min(100, item.percentage)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{item.actual.toLocaleString('ro-RO')} RON</span>
                <span>{item.budget.toLocaleString('ro-RO')} RON</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function DashboardWidgets({ transactions, savingsGoals = [], categoryBudgets = [] }: DashboardWidgetsProps) {
  const { t } = useTranslation();
  const [widgets, setWidgets] = useState<WidgetConfig[]>(loadConfig);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    saveConfig(widgets);
  }, [widgets]);

  const handleReorder = useCallback((newOrder: WidgetConfig[]) => {
    setWidgets(newOrder);
  }, []);

  const toggleVisibility = useCallback((id: WidgetId) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  }, []);

  const visibleWidgets = widgets.filter((w) => w.visible);

  const renderWidget = (widget: WidgetConfig) => {
    switch (widget.id) {
      case "balance-evolution":
        return <BalanceEvolutionChart transactions={transactions} />;
      case "category-donut":
        return <QuickStatsDonut transactions={transactions} />;
      case "savings-goals":
        return <SavingsGoalsWidget goals={savingsGoals} />;
      case "recent-transactions":
        return <RecentTransactionsWidget transactions={transactions} />;
      case "budget-vs-actual":
        return <BudgetVsActualWidget transactions={transactions} categoryBudgets={categoryBudgets} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with settings */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          📊 Dashboard
        </h3>
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Personalizare</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Personalizare Dashboard</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Activează/dezactivează widget-urile și trage pentru a reordona.
              </p>
              <Reorder.Group
                axis="y"
                values={widgets}
                onReorder={setWidgets}
                className="space-y-2"
              >
                {widgets.map((widget) => (
                  <Reorder.Item
                    key={widget.id}
                    value={widget}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border cursor-grab active:cursor-grabbing"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Label className="flex-1 cursor-grab">{widget.label}</Label>
                    <Switch
                      checked={widget.visible}
                      onCheckedChange={() => toggleVisibility(widget.id)}
                    />
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Widgets */}
      {visibleWidgets.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Niciun widget activ. Apasă pe Personalizare pentru a adăuga widget-uri.</p>
          </CardContent>
        </Card>
      ) : (
        <Reorder.Group
          axis="y"
          values={visibleWidgets}
          onReorder={(newOrder) => {
            const visibleIds = new Set(newOrder.map((w) => w.id));
            const hidden = widgets.filter((w) => !visibleIds.has(w.id));
            setWidgets([...newOrder, ...hidden]);
          }}
          className="space-y-4"
        >
          {visibleWidgets.map((widget) => (
            <Reorder.Item
              key={widget.id}
              value={widget}
              className="cursor-grab active:cursor-grabbing"
              whileDrag={{ scale: 1.02, boxShadow: "0 8px 25px rgba(0,0,0,0.15)" }}
            >
              <div className="relative group">
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="p-1 rounded bg-muted border shadow-sm">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                {renderWidget(widget)}
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}