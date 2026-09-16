import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { Transaction } from "./TransactionForm";
import { forecastMonthlySpending } from "@/lib/forecast";

interface ForecastCardProps {
  transactions: Transaction[];
}

export function ForecastCard({ transactions }: ForecastCardProps) {
  const forecast = useMemo(() => forecastMonthlySpending(transactions), [transactions]);

  const format = (n: number) =>
    new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON", maximumFractionDigits: 0 }).format(n);

  if (forecast.categories.length === 0) {
    return null;
  }

  const top = forecast.categories.slice(0, 5);

  return (
    <Card className="shadow-card">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          Prognoză cheltuieli luna curentă
        </CardTitle>
        <CardDescription>
          Estimare pe baza mediei ultimelor 3 luni și a ritmului din luna curentă.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-2xl font-semibold">{format(forecast.totalProjected)}</span>
          <span className="text-sm text-muted-foreground">
            estimat · {format(forecast.totalSpent)} cheltuiți până acum
          </span>
        </div>
        <ul className="space-y-3" aria-label="Prognoză pe categorii">
          {top.map((c) => {
            const percent = c.projected > 0 ? Math.min(100, (c.spentSoFar / c.projected) * 100) : 0;
            const up = c.diff > 0;
            return (
              <li key={c.category} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{c.category}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-muted-foreground">{format(c.projected)}</span>
                    {c.average > 0 && (
                      <Badge variant="outline" className={up ? "border-danger text-danger" : "border-success text-success"}>
                        {up ? <TrendingUp className="mr-1 h-3 w-3" aria-hidden="true" /> : <TrendingDown className="mr-1 h-3 w-3" aria-hidden="true" />}
                        {up ? "+" : ""}
                        {format(c.diff)}
                      </Badge>
                    )}
                  </span>
                </div>
                <Progress
                  value={percent}
                  aria-label={`${c.category}: ${format(c.spentSoFar)} din ${format(c.projected)} estimați`}
                />
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
