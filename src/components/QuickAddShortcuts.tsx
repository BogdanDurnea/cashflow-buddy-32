import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Zap, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Transaction } from "@/components/TransactionForm";
import { getCategoryConfig, expenseCategories, incomeCategories } from "@/lib/categoryConfig";
import { useTranslation } from "react-i18next";

interface QuickAddShortcutsProps {
  transactions: Transaction[];
  onAddTransaction: (transaction: Omit<Transaction, "id">) => void;
}

export function QuickAddShortcuts({ transactions, onAddTransaction }: QuickAddShortcutsProps) {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Get top 5 most used categories from transaction history
  const topCategories = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.type === "expense") {
        categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
      }
    });

    const sorted = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);

    // If less than 5, fill with defaults
    if (sorted.length < 5) {
      const defaults = expenseCategories.map((c) => c.name);
      for (const def of defaults) {
        if (!sorted.includes(def) && sorted.length < 5) {
          sorted.push(def);
        }
      }
    }

    return sorted;
  }, [transactions]);

  // Get last amount used for a category
  const getLastAmount = (category: string) => {
    const tx = transactions.find(
      (t) => t.type === "expense" && t.category === category
    );
    return tx ? tx.amount.toString() : "";
  };

  const handleCategoryClick = (category: string) => {
    if (activeCategory === category) {
      setActiveCategory(null);
      setAmount("");
      setDescription("");
      return;
    }
    setActiveCategory(category);
    setAmount(getLastAmount(category));
    setDescription("");
  };

  const handleQuickAdd = async () => {
    if (!activeCategory || !amount || Number(amount) <= 0) return;

    setIsSubmitting(true);
    try {
      await onAddTransaction({
        type: "expense",
        amount: Number(amount),
        category: activeCategory,
        description: description || activeCategory,
        date: new Date(),
        currency: "RON",
        exchange_rate: 1,
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setActiveCategory(null);
        setAmount("");
        setDescription("");
      }, 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="w-full"
    >
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-warning" />
        <span className="text-sm font-medium text-muted-foreground">
          {t("dashboard.quickAdd", "Adaugă rapid")}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {topCategories.map((category, index) => {
          const config = getCategoryConfig(category, "expense");
          const Icon = config.icon;
          const isActive = activeCategory === category;

          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Button
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryClick(category)}
                className={`h-9 gap-1.5 transition-all duration-200 ${
                  isActive
                    ? "shadow-md scale-105"
                    : "hover:scale-105 active:scale-95"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs">{category}</span>
              </Button>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {activeCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 mt-3">
              <Input
                type="number"
                placeholder="Sumă"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9 w-28 text-sm"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
              />
              <Input
                type="text"
                placeholder="Descriere (opțional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-9 flex-1 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
              />
              <Button
                size="sm"
                onClick={handleQuickAdd}
                disabled={!amount || Number(amount) <= 0 || isSubmitting}
                className="h-9 w-9 p-0 shrink-0"
              >
                <AnimatePresence mode="wait">
                  {isSubmitting ? (
                    <motion.div key="loading" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </motion.div>
                  ) : showSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1.2 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Check className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <motion.div key="plus" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Plus className="h-4 w-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActiveCategory(null);
                  setAmount("");
                  setDescription("");
                }}
                className="h-9 w-9 p-0 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
