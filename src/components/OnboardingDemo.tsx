import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import type { Transaction } from "@/components/TransactionForm";

const DISMISS_KEY = "onboardingDemoDismissed";

export function buildDemoTransactions(now: Date = new Date()): Omit<Transaction, "id">[] {
  const day = (offset: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - offset);
    return d;
  };

  return [
    { type: "income", amount: 5200, category: "Salariu", description: "Salariu lunar", date: day(12), currency: "RON", exchange_rate: 1 },
    { type: "expense", amount: 320.5, category: "Mâncare", description: "Cumpărături săptămânale", date: day(9), currency: "RON", exchange_rate: 1 },
    { type: "expense", amount: 180, category: "Utilități", description: "Curent și internet", date: day(7), currency: "RON", exchange_rate: 1 },
    { type: "expense", amount: 240, category: "Transport", description: "Combustibil", date: day(5), currency: "RON", exchange_rate: 1 },
    { type: "expense", amount: 49.99, category: "Divertisment", description: "Abonament streaming", date: day(3), currency: "RON", exchange_rate: 1 },
    { type: "income", amount: 450, category: "Alte venituri", description: "Proiect freelance", date: day(1), currency: "RON", exchange_rate: 1 },
  ];
}

interface OnboardingDemoProps {
  onAddTransaction: (transaction: Omit<Transaction, "id">) => void;
}

export function OnboardingDemo({ onAddTransaction }: OnboardingDemoProps) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "true");
  const [adding, setAdding] = useState(false);

  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  const handleAdd = () => {
    setAdding(true);
    buildDemoTransactions().forEach((t) => onAddTransaction(t));
    dismiss();
  };

  return (
    <Card className="shadow-card border-primary/30 bg-primary/5">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 rounded-lg bg-primary/15 shrink-0">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-sm">Începe cu câteva exemple</p>
            <p className="text-xs text-muted-foreground mt-1">
              Adăugăm 6 tranzacții demo ca să vezi cum arată graficele și rapoartele. Le poți șterge oricând.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={handleAdd} disabled={adding}>
            {adding ? "Se adaugă..." : "Adaugă exemple"}
          </Button>
          <Button size="sm" variant="ghost" onClick={dismiss} aria-label="Închide sugestia">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
