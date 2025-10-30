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

interface CategoryBudgetsProps {
  transactions: Transaction[];
}

interface CategoryBudget {
  category: string;
  limit: number;
}

export function CategoryBudgets({ transactions }: CategoryBudgetsProps) {
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [budgetAmount, setBudgetAmount] = useState<string>("");

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
      toast.error("Selectează categoria și suma");
      return;
    }

    const amount = parseFloat(budgetAmount);
    if (amount <= 0) {
      toast.error("Suma trebuie să fie mai mare decât 0");
      return;
    }

    // Check if category already has a budget
    if (categoryBudgets.some(b => b.category === selectedCategory)) {
      toast.error("Categoria are deja un buget setat");
      return;
    }

    const newBudgets = [...categoryBudgets, { category: selectedCategory, limit: amount }];
    saveBudgets(newBudgets);
    setIsDialogOpen(false);
    setSelectedCategory("");
    setBudgetAmount("");
    toast.success("Buget adăugat cu succes");
  };

  const handleDeleteBudget = (category: string) => {
    const newBudgets = categoryBudgets.filter(b => b.category !== category);
    saveBudgets(newBudgets);
    toast.success("Buget șters");
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
            <span>Obiective pe Categorii</span>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Adaugă
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adaugă buget pentru categorie</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectează categoria" />
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
                  <Label>Limită lunară (RON)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder="Ex: 1000"
                  />
                </div>
                <Button onClick={handleAddBudget} className="w-full">
                  Salvează
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categoryBudgets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nu ai setat obiective pentru categorii.
            <br />
            Apasă pe "Adaugă" pentru a începe.
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
                    <span className="text-muted-foreground">Cheltuit</span>
                    <span className="font-semibold">
                      {spent.toFixed(2)} / {budget.limit.toFixed(2)} RON
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className={`h-2 ${isOverBudget ? "bg-destructive/20" : ""}`}
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Rămas: {Math.max(0, budget.limit - spent).toFixed(2)} RON
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
                      Ai depășit limita cu {(spent - budget.limit).toFixed(2)} RON
                    </AlertDescription>
                  </Alert>
                )}

                {isNearLimit && (
                  <Alert className="py-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                    <AlertTriangle className="h-3 w-3 text-yellow-600" />
                    <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-200">
                      Ai folosit {percentage.toFixed(0)}% din limită
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
