import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalendarRange } from "lucide-react";
import { Transaction } from "./TransactionForm";

interface CurrentWeekWidgetProps {
  transactions: Transaction[];
  monthlyBudget: number;
}

const DAY_LABELS = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // luni = 0
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

export function CurrentWeekWidget({ transactions, monthlyBudget }: CurrentWeekWidgetProps) {
  const data = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const perDay = new Array(7).fill(0) as number[];

    transactions.forEach((t) => {
      if (t.type !== "expense") return;
      const d = new Date(t.date);
      if (d < weekStart) return;
      const index = Math.floor((d.getTime() - weekStart.getTime()) / 86400000);
      if (index >= 0 && index < 7) perDay[index] += t.amount;
    });

    const total = perDay.reduce((a, b) => a + b, 0);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyLimit = monthlyBudget > 0 ? monthlyBudget / daysInMonth : 0;
    const weeklyLimit = dailyLimit * 7;
    const max = Math.max(...perDay, dailyLimit, 1);
    return { perDay, total, dailyLimit, weeklyLimit, max, todayIndex: (now.getDay() + 6) % 7 };
  }, [transactions, monthlyBudget]);

  const format = (n: number) =>
    new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON", maximumFractionDigits: 0 }).format(n);

  const percent = data.weeklyLimit > 0 ? Math.min(100, (data.total / data.weeklyLimit) * 100) : 0;

  return (
    <Card className="shadow-card">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <CalendarRange className="h-4 w-4 text-primary" aria-hidden="true" />
          Săptămâna curentă
        </CardTitle>
        <CardDescription>
          {data.dailyLimit > 0
            ? `Limită zilnică sugerată: ${format(data.dailyLimit)}`
            : "Setează un buget lunar pentru limita zilnică sugerată."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold">{format(data.total)}</span>
          {data.weeklyLimit > 0 && (
            <span className="text-sm text-muted-foreground">din {format(data.weeklyLimit)}</span>
          )}
        </div>
        {data.weeklyLimit > 0 && (
          <Progress value={percent} aria-label={`Cheltuit ${format(data.total)} din ${format(data.weeklyLimit)}`} />
        )}
        <div
          className="flex items-end justify-between gap-1"
          role="img"
          aria-label={`Cheltuieli pe zile: ${data.perDay
            .map((v, i) => `${DAY_LABELS[i]} ${format(v)}`)
            .join(", ")}`}
        >
          {data.perDay.map((value, i) => (
            <div key={DAY_LABELS[i]} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`w-full rounded-t ${
                  value > data.dailyLimit && data.dailyLimit > 0 ? "bg-danger/70" : "bg-primary/60"
                }`}
                style={{ height: `${Math.max(4, (value / data.max) * 56)}px` }}
              />
              <span
                className={`text-[10px] ${
                  i === data.todayIndex ? "font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                {DAY_LABELS[i]}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
