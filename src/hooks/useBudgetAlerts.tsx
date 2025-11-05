import { useEffect, useRef } from "react";
import { Transaction } from "@/components/TransactionForm";
import { toast } from "sonner";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { usePushNotifications } from "./usePushNotifications";

interface BudgetAlert {
  type: "monthly" | "category";
  category?: string;
  spent: number;
  limit: number;
  percentage: number;
}

interface UseBudgetAlertsProps {
  transactions: Transaction[];
  monthlyBudget: number;
  categoryBudgets: { category: string; limit: number }[];
}

export function useBudgetAlerts({ transactions, monthlyBudget, categoryBudgets }: UseBudgetAlertsProps) {
  const previousAlerts = useRef<Set<string>>(new Set());
  const hasShownInitialAlerts = useRef(false);
  const { sendBudgetAlert, requestPermission } = usePushNotifications();
  
  const requestNotificationPermission = requestPermission;

  useEffect(() => {
    // Skip initial mount to avoid showing alerts on page load
    if (!hasShownInitialAlerts.current) {
      hasShownInitialAlerts.current = true;
      
      // Initialize previous alerts state
      const currentAlerts = checkBudgets();
      currentAlerts.forEach(alert => {
        const key = getAlertKey(alert);
        previousAlerts.current.add(key);
      });
      
      return;
    }

    const currentAlerts = checkBudgets();
    const newAlerts = currentAlerts.filter(alert => {
      const key = getAlertKey(alert);
      return !previousAlerts.current.has(key);
    });

    // Show notifications for new alerts
    newAlerts.forEach(alert => {
      showNotification(alert);
      previousAlerts.current.add(getAlertKey(alert));
    });

    // Clean up old alerts
    const currentKeys = new Set(currentAlerts.map(getAlertKey));
    previousAlerts.current.forEach(key => {
      if (!currentKeys.has(key)) {
        previousAlerts.current.delete(key);
      }
    });
  }, [transactions, monthlyBudget, categoryBudgets]);

  const getAlertKey = (alert: BudgetAlert): string => {
    if (alert.type === "monthly") {
      return `monthly-${Math.floor(alert.percentage / 10)}`;
    }
    return `category-${alert.category}-${Math.floor(alert.percentage / 10)}`;
  };

  const checkBudgets = (): BudgetAlert[] => {
    const alerts: BudgetAlert[] = [];
    const now = new Date();

    // Calculate monthly expenses
    const monthlyExpenses = transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === "expense" && 
               transactionDate.getMonth() === now.getMonth() && 
               transactionDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + (t.amount * (t.exchange_rate || 1)), 0);

    const monthlyPercentage = (monthlyExpenses / monthlyBudget) * 100;

    // Check monthly budget
    if (monthlyPercentage >= 80) {
      alerts.push({
        type: "monthly",
        spent: monthlyExpenses,
        limit: monthlyBudget,
        percentage: monthlyPercentage
      });
    }

    // Check category budgets
    categoryBudgets.forEach(budget => {
      const categoryExpense = transactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          return t.type === "expense" && 
                 t.category === budget.category &&
                 transactionDate.getMonth() === now.getMonth() && 
                 transactionDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, t) => sum + (t.amount * (t.exchange_rate || 1)), 0);

      const categoryPercentage = (categoryExpense / budget.limit) * 100;

      if (categoryPercentage >= 80) {
        alerts.push({
          type: "category",
          category: budget.category,
          spent: categoryExpense,
          limit: budget.limit,
          percentage: categoryPercentage
        });
      }
    });

    return alerts;
  };

  const showNotification = (alert: BudgetAlert) => {
    const isOverBudget = alert.percentage >= 100;
    const title = alert.type === "monthly" 
      ? "Buget Lunar" 
      : `Categorie: ${alert.category}`;

    // Send push notification
    sendBudgetAlert(
      title,
      alert.spent,
      alert.limit
    );

    // Show toast notification
    if (isOverBudget) {
      toast.error(
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-sm mt-1">
              Ai depășit bugetul! Cheltuit: {alert.spent.toFixed(2)} RON din {alert.limit.toFixed(2)} RON
            </div>
          </div>
        </div>,
        {
          duration: 5000,
          position: "top-center",
        }
      );
    } else {
      toast.warning(
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-sm mt-1">
              Atenție! Ai folosit {alert.percentage.toFixed(0)}% din buget ({alert.spent.toFixed(2)} / {alert.limit.toFixed(2)} RON)
            </div>
          </div>
        </div>,
        {
          duration: 4000,
          position: "top-center",
        }
      );
    }
  };

  return { requestNotificationPermission };
}
