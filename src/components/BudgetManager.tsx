import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, Edit, Check, X, AlertTriangle, Target } from "lucide-react";
import { Transaction } from "@/components/TransactionForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BudgetManagerProps {
  transactions: Transaction[];
  userId: string;
}

export function BudgetManager({ transactions, userId }: BudgetManagerProps) {
  const [monthlyBudget, setMonthlyBudget] = useState<number>(5000);
  const [isEditing, setIsEditing] = useState(false);
  const [tempBudget, setTempBudget] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Load budget from Supabase
  useEffect(() => {
    const loadBudget = async () => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const { data, error } = await supabase
        .from("budgets")
        .select("amount")
        .eq("user_id", userId)
        .eq("month", month)
        .eq("year", year)
        .single();

      if (data) {
        setMonthlyBudget(Number(data.amount));
      }
      setLoading(false);
    };

    loadBudget();
  }, [userId]);

  // Calculate current month expenses
  const currentMonthExpenses = transactions
    .filter(t => {
      const now = new Date();
      const transactionDate = new Date(t.date);
      return t.type === "expense" && 
             transactionDate.getMonth() === now.getMonth() && 
             transactionDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const budgetPercentage = (currentMonthExpenses / monthlyBudget) * 100;
  const remainingBudget = monthlyBudget - currentMonthExpenses;
  const isOverBudget = currentMonthExpenses > monthlyBudget;

  const handleSaveBudget = async () => {
    const newBudget = parseFloat(tempBudget);
    if (newBudget > 0) {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const { error } = await supabase
        .from("budgets")
        .upsert({
          user_id: userId,
          month,
          year,
          amount: newBudget
        }, {
          onConflict: "user_id,month,year"
        });

      if (error) {
        toast.error("Eroare la salvarea bugetului");
        console.error(error);
      } else {
        setMonthlyBudget(newBudget);
        setIsEditing(false);
        toast.success("Budget salvat cu succes");
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setTempBudget("");
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <span>Obiectiv Buget Lunar</span>
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditing(true);
                setTempBudget(monthlyBudget.toString());
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-2">
            <Label htmlFor="budget-input">Budget lunar (RON)</Label>
            <div className="flex gap-2">
              <Input
                id="budget-input"
                type="number"
                step="0.01"
                value={tempBudget}
                onChange={(e) => setTempBudget(e.target.value)}
                placeholder="Introdu bugetul lunar"
              />
              <Button
                size="sm"
                onClick={handleSaveBudget}
                className="shrink-0"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelEdit}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cheltuit</span>
                <span className="font-semibold">
                  {currentMonthExpenses.toFixed(2)} / {monthlyBudget.toFixed(2)} RON
                </span>
              </div>
              <Progress 
                value={Math.min(budgetPercentage, 100)} 
                className={`h-3 ${isOverBudget ? "bg-destructive/20" : ""}`}
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progres</span>
                <span className={`font-semibold ${isOverBudget ? "text-destructive" : "text-primary"}`}>
                  {budgetPercentage.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Rămas disponibil:</span>
                <span className={`text-lg font-bold ${isOverBudget ? "text-destructive" : "text-success"}`}>
                  {remainingBudget.toFixed(2)} RON
                </span>
              </div>
            </div>

            {isOverBudget && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Ai depășit bugetul lunar cu {Math.abs(remainingBudget).toFixed(2)} RON!
                </AlertDescription>
              </Alert>
            )}

            {!isOverBudget && budgetPercentage >= 80 && (
              <Alert className="mt-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  Atenție! Ai folosit {budgetPercentage.toFixed(0)}% din bugetul lunar.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
