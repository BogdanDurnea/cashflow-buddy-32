import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "./TransactionForm";
import { getCategoryConfig } from "@/lib/categoryConfig";
import { motion } from "framer-motion";
import { PieChart as PieChartIcon } from "lucide-react";

interface QuickStatsDonutProps {
  transactions: Transaction[];
}

export function QuickStatsDonut({ transactions }: QuickStatsDonutProps) {
  const { t, i18n } = useTranslation();
  const currency = t("common.currency");

  const { donutData, totalExpenses } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyExpenses = transactions.filter(tx => {
      const d = new Date(tx.date);
      return tx.type === "expense" && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const byCategory = monthlyExpenses.reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

    const sorted = Object.entries(byCategory)
      .map(([category, amount]) => ({
        name: category,
        value: amount,
        color: getCategoryConfig(category, "expense").color,
      }))
      .sort((a, b) => b.value - a.value);

    // Show top 5, group rest as "Other"
    const top5 = sorted.slice(0, 5);
    const rest = sorted.slice(5);
    if (rest.length > 0) {
      top5.push({
        name: t("categories.other"),
        value: rest.reduce((s, r) => s + r.value, 0),
        color: "hsl(var(--muted-foreground))",
      });
    }

    return {
      donutData: top5,
      totalExpenses: monthlyExpenses.reduce((s, tx) => s + tx.amount, 0),
    };
  }, [transactions, t]);

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat(i18n.language, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  if (donutData.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="shadow-card hover:shadow-lg transition-smooth overflow-hidden">
        <CardHeader className="pb-2 p-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-primary" />
            {t("analytics.topCategories")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-center gap-4">
            {/* Donut chart */}
            <div className="relative w-28 h-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${formatAmount(value)} ${currency}`, ""]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center total */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-foreground">
                  {formatAmount(totalExpenses)}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-1.5 min-w-0">
              {donutData.map((item, i) => {
                const pct = totalExpenses > 0 ? ((item.value / totalExpenses) * 100).toFixed(0) : "0";
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate flex-1 text-muted-foreground">{item.name}</span>
                    <span className="font-medium text-foreground tabular-nums">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
