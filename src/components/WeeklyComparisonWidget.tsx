import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "./TransactionForm";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, TrendingDown, Minus } from "lucide-react";
import { startOfWeek, endOfWeek, subWeeks } from "date-fns";

interface WeeklyComparisonWidgetProps {
  transactions: Transaction[];
}

export function WeeklyComparisonWidget({ transactions }: WeeklyComparisonWidgetProps) {
  const { t, i18n } = useTranslation();
  const currency = t("common.currency");

  const { thisWeek, lastWeek, percentChange } = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    const thisWeekTotal = transactions
      .filter(tx => {
        const d = new Date(tx.date);
        return tx.type === "expense" && d >= thisWeekStart && d <= thisWeekEnd;
      })
      .reduce((s, tx) => s + tx.amount, 0);

    const lastWeekTotal = transactions
      .filter(tx => {
        const d = new Date(tx.date);
        return tx.type === "expense" && d >= lastWeekStart && d <= lastWeekEnd;
      })
      .reduce((s, tx) => s + tx.amount, 0);

    const pct = lastWeekTotal > 0
      ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
      : thisWeekTotal > 0 ? 100 : 0;

    return { thisWeek: thisWeekTotal, lastWeek: lastWeekTotal, percentChange: pct };
  }, [transactions]);

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat(i18n.language, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const isUp = percentChange > 0;
  const isDown = percentChange < 0;
  const maxVal = Math.max(thisWeek, lastWeek, 1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="shadow-card hover:shadow-lg transition-smooth overflow-hidden">
        <CardHeader className="pb-2 p-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-primary" />
            {t("dashboard.weeklyComparison")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          {/* This week bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("dashboard.thisWeek")}</span>
              <span className="font-semibold text-foreground">{formatAmount(thisWeek)} {currency}</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                initial={{ width: 0 }}
                animate={{ width: `${(thisWeek / maxVal) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
              />
            </div>
          </div>

          {/* Last week bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("dashboard.lastWeek")}</span>
              <span className="font-semibold text-foreground">{formatAmount(lastWeek)} {currency}</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-muted-foreground/40 to-muted-foreground/20"
                initial={{ width: 0 }}
                animate={{ width: `${(lastWeek / maxVal) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
              />
            </div>
          </div>

          {/* Percent change badge */}
          <div className="flex items-center justify-center pt-1">
            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
              isUp ? "bg-danger/10 text-danger" :
              isDown ? "bg-success/10 text-success" :
              "bg-muted text-muted-foreground"
            }`}>
              {isUp ? <ArrowUp className="h-3 w-3" /> : 
               isDown ? <ArrowDown className="h-3 w-3" /> : 
               <Minus className="h-3 w-3" />}
              {Math.abs(percentChange).toFixed(0)}%
              <span className="ml-0.5">
                {isUp ? t("dashboard.moreSpent") : isDown ? t("dashboard.lessSpent") : ""}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
