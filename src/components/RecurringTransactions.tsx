import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Repeat, Plus, Trash2 } from "lucide-react";
import { Transaction } from "@/components/TransactionForm";
import { getCategoryConfig, incomeCategories, expenseCategories } from "@/lib/categoryConfig";
import { toast } from "sonner";

export interface RecurringTransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly";
  nextDate: Date;
  isActive: boolean;
}

interface RecurringTransactionsProps {
  recurringTransactions: RecurringTransaction[];
  onAddRecurring: (transaction: Omit<RecurringTransaction, "id" | "nextDate" | "isActive">) => void;
  onDeleteRecurring: (id: string) => void;
  onToggleRecurring: (id: string) => void;
}

export function RecurringTransactions({
  recurringTransactions,
  onAddRecurring,
  onDeleteRecurring,
  onToggleRecurring,
}: RecurringTransactionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("monthly");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Introdu o sumă validă");
      return;
    }
    
    if (!category) {
      toast.error("Selectează o categorie");
      return;
    }

    onAddRecurring({
      type,
      amount: parseFloat(amount),
      category,
      description,
      frequency,
    });

    setAmount("");
    setCategory("");
    setDescription("");
    setIsOpen(false);
    toast.success("Tranzacție recurentă adăugată!");
  };

  const formatNextDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case "daily": return "Zilnic";
      case "weekly": return "Săptămânal";
      case "monthly": return "Lunar";
      default: return freq;
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" />
            <span>Tranzacții Recurente</span>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adaugă Tranzacție Recurentă</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rec-type">Tip</Label>
                  <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
                    <SelectTrigger id="rec-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Venit</SelectItem>
                      <SelectItem value="expense">Cheltuială</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rec-amount">Sumă (RON)</Label>
                  <Input
                    id="rec-amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rec-category">Categorie</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger id="rec-category">
                      <SelectValue placeholder="Selectează categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {(type === "income" ? incomeCategories : expenseCategories).map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <SelectItem key={cat.name} value={cat.name}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" style={{ color: cat.color }} />
                              <span>{cat.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rec-frequency">Frecvență</Label>
                  <Select value={frequency} onValueChange={(v) => setFrequency(v as any)}>
                    <SelectTrigger id="rec-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Zilnic</SelectItem>
                      <SelectItem value="weekly">Săptămânal</SelectItem>
                      <SelectItem value="monthly">Lunar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rec-description">Descriere (opțional)</Label>
                  <Textarea
                    id="rec-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descriere tranzacție"
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Adaugă Tranzacție Recurentă
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recurringTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nicio tranzacție recurentă configurată
          </p>
        ) : (
          <div className="space-y-3">
            {recurringTransactions.map((transaction) => {
              const config = getCategoryConfig(transaction.category, transaction.type);
              const Icon = config.icon;
              
              return (
                <div
                  key={transaction.id}
                  className={`p-3 rounded-lg border transition-opacity ${
                    transaction.isActive ? "bg-card" : "bg-muted/50 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: config.lightColor }}
                      >
                        <Icon className="h-4 w-4" style={{ color: config.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{transaction.category}</span>
                          <span className="text-xs text-muted-foreground">
                            {getFrequencyLabel(transaction.frequency)}
                          </span>
                        </div>
                        {transaction.description && (
                          <p className="text-sm text-muted-foreground">
                            {transaction.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Următoarea: {formatNextDate(transaction.nextDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-bold ${
                            transaction.type === "income" ? "text-success" : "text-danger"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {transaction.amount.toFixed(2)} RON
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onToggleRecurring(transaction.id)}
                      >
                        {transaction.isActive ? "Pauză" : "Activează"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteRecurring(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
