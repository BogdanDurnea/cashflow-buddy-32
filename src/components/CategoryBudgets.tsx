import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Target, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Transaction } from "@/components/TransactionForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { expenseCategories } from "@/lib/categoryConfig";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface CategoryBudgetsProps {
  transactions: Transaction[];
}

interface CategoryBudget {
  category: string;
  limit: number;
}

export function CategoryBudgets({ transactions }: CategoryBudgetsProps) {
  const { t, i18n } = useTranslation();
  const currency = t("common.currency");

  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [budgetAmount, setBudgetAmount] = useState<string>("");

  // Format numbers using Intl
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat(i18n.language, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Load category budgets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("categoryBudgets");
    if (saved) {
      setCategoryBudgets(JSON.parse(saved));
    }
  }, []);

  // Save category budgets to localStorage
  const saveBudgets = (budgets: CategoryBudget[]) => {
    setCategoryBudgets(budgets);
    localStorage.setItem("categoryBudgets", JSON.stringify(budgets));
  };

  // Calculate current month expenses by category
  const getCategoryExpense = (category: string) => {
    const now = new Date();
    return transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return t.type === "expense" && 
               t.category === category &&
               transactionDate.getMonth() === now.getMonth() && 
               transactionDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleAddBudget = () => {
    if (!selectedCategory || !budgetAmount) {
      toast.error(t("budgets.selectCategoryAndAmount"));
      return;
    }

    const amount = parseFloat(budgetAmount);
    if (amount <= 0) {
      toast.error(t("budgets.amountMustBePositive"));
      return;
    }

    // Check if category already has a budget
    if (categoryBudgets.some(b => b.category === selectedCategory)) {
      toast.error(t("budgets.categoryHasBudget"));
      return;
    }

    const newBudgets = [...categoryBudgets, { category: selectedCategory, limit: amount }];
    saveBudgets(newBudgets);
    setIsDialogOpen(false);
    setSelectedCategory("");
    setBudgetAmount("");
    toast.success(t("budgets.budgetAdded"));
  };

  const handleDeleteBudget = (category: string) => {
    const newBudgets = categoryBudgets.filter(b => b.category !== category);
    saveBudgets(newBudgets);
    toast.success(t("budgets.budgetDeleted"));
  };

  const availableCategories = expenseCategories.filter(
    cat => !categoryBudgets.some(b => b.category === cat.name)
  );

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <span>{t("budgets.categoryGoals")}</span>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                {t("common.add")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("budgets.addCategoryBudget")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{t("transactions.category")}</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("budgets.selectCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map(cat => (
                        <SelectItem key={cat.name} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("budgets.monthlyLimit")} ({currency})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder="Ex: 1000"
                  />
                </div>
                <Button onClick={handleAddBudget} className="w-full">
                  {t("common.save")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categoryBudgets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {t("budgets.noCategoryBudgets")}
            <br />
            {t("budgets.noCategoryBudgetsHint")}
          </div>
        ) : (
          categoryBudgets.map(budget => {
            const spent = getCategoryExpense(budget.category);
            const percentage = (spent / budget.limit) * 100;
            const isOverBudget = spent > budget.limit;
            const isNearLimit = percentage >= 80 && !isOverBudget;

            return (
              <div key={budget.category} className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{budget.category}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteBudget(budget.category)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("budgets.spent")}</span>
                    <span className="font-semibold">
                      {formatAmount(spent)} / {formatAmount(budget.limit)} {currency}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className={`h-2 ${isOverBudget ? "bg-destructive/20" : ""}`}
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {t("budgets.remaining")}: {formatAmount(Math.max(0, budget.limit - spent))} {currency}
                    </span>
                    <span className={`font-semibold ${isOverBudget ? "text-destructive" : "text-primary"}`}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {isOverBudget && (
                  <Alert variant="destructive" className="py-2">
                    <AlertTriangle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      {t("budgets.categoryExceededBy", { 
                        amount: formatAmount(spent - budget.limit), 
                        currency 
                      })}
                    </AlertDescription>
                  </Alert>
                )}

                {isNearLimit && (
                  <Alert className="py-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                    <AlertTriangle className="h-3 w-3 text-yellow-600" />
                    <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-200">
                      {t("budgets.categoryWarning", { percentage: percentage.toFixed(0) })}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
