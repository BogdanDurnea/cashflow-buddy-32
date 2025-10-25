import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle } from "lucide-react";
import { incomeCategories, expenseCategories } from "@/lib/categoryConfig";

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: Date;
}

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, "id">) => void;
}


export function TransactionForm({ onAddTransaction }: TransactionFormProps) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;

    onAddTransaction({
      type,
      amount: parseFloat(amount),
      category,
      description,
      date: new Date()
    });

    // Reset form
    setAmount("");
    setCategory("");
    setDescription("");
  };

  const categories = type === "income" ? incomeCategories : expenseCategories;
  const categoryNames = categories.map(c => c.name);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Adaugă tranzacție nouă
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Tip tranzacție</Label>
              <Select value={type} onValueChange={(value: "income" | "expense") => setType(value)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Venit</SelectItem>
                  <SelectItem value="expense">Cheltuială</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Sumă (RON)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Categorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selectează categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <SelectItem key={cat.name} value={cat.name}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="p-1 rounded"
                          style={{ 
                            backgroundColor: cat.lightColor,
                            color: cat.color
                          }}
                        >
                          <Icon className="h-3 w-3" />
                        </div>
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Descriere (opțional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descriere tranzacție..."
              rows={2}
            />
          </div>

          <Button
            type="submit"
            className="w-full transition-spring"
            variant={type === "income" ? "success" : "danger"}
          >
            Adaugă {type === "income" ? "venit" : "cheltuială"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}