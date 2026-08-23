import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Gauge,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/components/TransactionForm";
import { computeKpi, type HealthLevel } from "@/lib/kpi";

interface KPIWidgetsProps {
  transactions: Transaction[];
}

export const KPIWidgets = React.memo(function KPIWidgets({ transactions }: KPIWidgetsProps) {
  const { t, i18n } = useTranslation();
  const currency = t("common.currency");

  const kpi = useMemo(() => computeKpi(transactions), [transactions]);


  const formatAmount = (amount: number) =>
    new Intl.NumberFormat(i18n.language, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const levelStyles: Record<HealthLevel, string> = {
    healthy: "bg-success/15 text-success border-success/30",
    watch: "bg-warning/15 text-warning border-warning/30",
    risk: "bg-destructive/15 text-destructive border-destructive/30",
  };

  const overBudget = kpi.variance > 0;

  const cards = [
    {
      key: "health",
      title: t("kpi.healthTitle"),
      icon: Gauge,
      body: (
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="text-3xl font-bold" data-testid="kpi-health-score">{kpi.score}</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <Badge variant="outline" className={levelStyles[kpi.level]}>
              {t(`kpi.level.${kpi.level}`)}
            </Badge>
          </div>
          <Progress value={kpi.score} aria-label={t("kpi.healthTitle")} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {t("kpi.healthDescription", { rate: kpi.savingsRate.toFixed(1) })}
          </p>
        </div>
      ),
    },
    {
      key: "cashflow",
      title: t("kpi.cashInOutTitle"),
      icon: Activity,
      body: (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-success">
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              <span className="text-lg font-semibold">
                {formatAmount(kpi.income)} {currency}
              </span>
            </div>
            <div className="flex items-center gap-2 text-destructive">
              <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
              <span className="text-lg font-semibold">
                {formatAmount(kpi.expense)} {currency}
              </span>
            </div>
          </div>
          <div
            className="flex h-2 w-full overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={t("kpi.cashInOutTitle")}
          >
            <div className="bg-success transition-all duration-500" style={{ width: `${kpi.inOutRatio}%` }} />
            <div className="bg-destructive transition-all duration-500" style={{ width: `${100 - kpi.inOutRatio}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("kpi.netCashFlow")}:{" "}
            <span className={kpi.net >= 0 ? "font-medium text-success" : "font-medium text-destructive"}>
              {formatAmount(kpi.net)} {currency}
            </span>
          </p>
        </div>
      ),
    },
    {
      key: "forecast",
      title: t("kpi.forecastTitle"),
      icon: Target,
      body: (
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">{t("kpi.actualToDate")}</p>
              <p className="text-lg font-semibold">
                {formatAmount(kpi.expense)} {currency}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{t("kpi.forecastMonthEnd")}</p>
              <p className="text-lg font-semibold">
                {formatAmount(kpi.forecastExpense)} {currency}
              </p>
            </div>
          </div>
          <Progress value={kpi.paceProgress} aria-label={t("kpi.forecastTitle")} className="h-2" />
          <p
            className={`flex items-center gap-1 text-xs ${
              overBudget ? "text-destructive" : "text-success"
            }`}
          >
            {overBudget ? (
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {t(overBudget ? "kpi.aboveForecast" : "kpi.belowForecast", {
              amount: `${formatAmount(Math.abs(kpi.variance))} ${currency}`,
              percent: Math.abs(kpi.variancePct).toFixed(0),
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("kpi.daysLeft", { count: kpi.daysLeft })}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="kpi-widgets">
      {cards.map((card, i) => (
        <motion.div
          key={card.key}
          data-testid={`kpi-card-${card.key}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
        >
          <Card className="h-full shadow-card transition-all duration-300 hover:shadow-lg">

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-primary" aria-hidden="true" />
            </CardHeader>
            <CardContent>{card.body}</CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
});
