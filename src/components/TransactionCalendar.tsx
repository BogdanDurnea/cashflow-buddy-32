import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CalendarDays, Repeat } from "lucide-react";
import { Transaction } from "./TransactionForm";
import type { RecurringTransaction } from "./RecurringTransactions";

interface TransactionCalendarProps {
  transactions: Transaction[];
  recurringTransactions?: RecurringTransaction[];
}

const WEEKDAYS = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];

export function TransactionCalendar({ transactions, recurringTransactions = [] }: TransactionCalendarProps) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const byDay = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (d.getFullYear() !== cursor.getFullYear() || d.getMonth() !== cursor.getMonth()) return;
      const k = key(d);
      map.set(k, [...(map.get(k) ?? []), t]);
    });
    return map;
  }, [transactions, cursor]);

  const recurringDays = useMemo(() => {
    const set = new Set<number>();
    recurringTransactions
      .filter((r) => r.isActive)
      .forEach((r) => {
        const d = new Date(r.nextDate);
        if (r.frequency === "monthly") set.add(d.getDate());
        else if (
          d.getFullYear() === cursor.getFullYear() &&
          d.getMonth() === cursor.getMonth()
        )
          set.add(d.getDate());
      });
    return set;
  }, [recurringTransactions, cursor]);

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const total = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = new Array(offset).fill(null);
    for (let i = 1; i <= total; i++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), i));
    return cells;
  }, [cursor]);

  const format = (n: number) =>
    new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON", maximumFractionDigits: 0 }).format(n);

  const monthLabel = cursor.toLocaleDateString("ro-RO", { month: "long", year: "numeric" });
  const selected = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  return (
    <Card className="shadow-card">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
            Calendar tranzacții
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Luna anterioară"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[8rem] text-center text-sm font-medium capitalize">{monthLabel}</span>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Luna următoare"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription className="flex items-center gap-1">
          <Repeat className="h-3 w-3" aria-hidden="true" /> Zilele cu plăți recurente sunt marcate cu un punct.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {WEEKDAYS.map((w) => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            if (!d) return <span key={`empty-${i}`} />;
            const k = key(d);
            const items = byDay.get(k) ?? [];
            const expense = items.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
            const income = items.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
            const isSelected = selectedDay === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setSelectedDay(isSelected ? null : k)}
                aria-label={`${d.getDate()} ${monthLabel}: ${items.length} tranzacții, cheltuieli ${format(expense)}`}
                aria-pressed={isSelected}
                className={`flex min-h-[3.25rem] flex-col items-center justify-start rounded-md border p-1 text-xs transition-colors ${
                  isSelected ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted/60"
                }`}
              >
                <span className="flex items-center gap-0.5 font-medium">
                  {d.getDate()}
                  {recurringDays.has(d.getDate()) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                  )}
                </span>
                {expense > 0 && <span className="text-danger">-{format(expense)}</span>}
                {income > 0 && <span className="text-success">+{format(income)}</span>}
              </button>
            );
          })}
        </div>

        {selectedDay && (
          <div className="rounded-md border p-3">
            {selected.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nicio tranzacție în ziua selectată.</p>
            ) : (
              <ul className="space-y-2">
                {selected.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">
                      {t.category}
                      {t.description ? ` · ${t.description}` : ""}
                    </span>
                    <Badge variant="outline" className={t.type === "income" ? "border-success text-success" : "border-danger text-danger"}>
                      {t.type === "income" ? "+" : "-"}
                      {format(t.amount)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
