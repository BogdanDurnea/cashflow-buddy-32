import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Transaction } from "./TransactionForm";
import { incomeCategories, expenseCategories } from "@/lib/categoryConfig";
import { TransactionComments } from "./TransactionComments";

interface EditTransactionDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}


export function EditTransactionDialog({ 
  transaction, 
  open, 
  onOpenChange, 
  onSave, 
  onDelete 
}: EditTransactionDialogProps) {
  const { t } = useTranslation();
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
          <DialogTitle>{t("transactions.editTransaction")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-type">{t("transactions.type")}</Label>
                <Select value={type} onValueChange={(value: "income" | "expense") => setType(value)}>
                  <SelectTrigger id="edit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">{t("transactions.income")}</SelectItem>
                    <SelectItem value="expense">{t("transactions.expense")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-amount">{t("transactions.amount")} (RON)</Label>
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
              <Label htmlFor="edit-category">{t("transactions.category")}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="edit-category">
                  <SelectValue placeholder={t("transactions.selectCategory")} />
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
              <Label htmlFor="edit-description">{t("transactions.descriptionOptional")}</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("transactions.descriptionPlaceholder")}
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
              {t("common.delete")}
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 sm:flex-none"
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" className="flex-1 sm:flex-none">
                {t("common.save")}
              </Button>
            </div>
          </DialogFooter>
        </form>

        {transaction && (
          <div className="mt-4 border-t pt-4">
            <TransactionComments transactionId={transaction.id} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
