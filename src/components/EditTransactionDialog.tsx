import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Transaction } from "./TransactionForm";

interface EditTransactionDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

const incomeCategories = [
  "Salariu",
  "Freelancing",
  "Investiții",
  "Vânzări",
  "Altele"
];

const expenseCategories = [
  "Mâncare",
  "Transport",
  "Utilități",
  "Închiriere",
  "Distracție",
  "Sănătate",
  "Shopping",
  "Educație",
  "Altele"
];

export function EditTransactionDialog({ 
  transaction, 
  open, 
  onOpenChange, 
  onSave, 
  onDelete 
}: EditTransactionDialogProps) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
      setDescription(transaction.description);
    }
  }, [transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction || !amount || !category) return;

    onSave({
      ...transaction,
      type,
      amount: parseFloat(amount),
      category,
      description,
    });

    onOpenChange(false);
  };

  const handleDelete = () => {
    if (transaction) {
      onDelete(transaction.id);
      onOpenChange(false);
    }
  };

  const categories = type === "income" ? incomeCategories : expenseCategories;

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editează tranzacția</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">Tip tranzacție</Label>
                <Select value={type} onValueChange={(value: "income" | "expense") => setType(value)}>
                  <SelectTrigger id="edit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Venit</SelectItem>
                    <SelectItem value="expense">Cheltuială</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-amount">Sumă (RON)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-category">Categorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder="Selectează categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-description">Descriere (opțional)</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descriere tranzacție..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-6">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="w-full sm:w-auto"
            >
              Șterge
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 sm:flex-none"
              >
                Anulează
              </Button>
              <Button type="submit" className="flex-1 sm:flex-none">
                Salvează
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}