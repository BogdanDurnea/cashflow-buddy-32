import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Transaction } from "./TransactionForm";
import { getCategoryConfig } from "@/lib/categoryConfig";

interface CategoryTrendsSparklineProps {
  transactions: Transaction[];
}

function Sparkline({ data, color, months }: { data: number[]; color: string; months: { month: number; year: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length < 2) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const padding = 2;

  const pointsData = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (w - padding * 2);
    const y = h - padding - ((v - min) / range) * (h - padding * 2);
    return { x, y, value: v };
  });

  const pathD = pointsData.reduce((acc, p, i) => (i === 0 ? `M${p.x},${p.y}` : `${acc} L${p.x},${p.y}`), "");

  const monthNames = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="relative shrink-0">
      <svg
        width={w}
        height={h}
        className="shrink-0 cursor-crosshair"
        onMouseLeave={() => setHovered(null)}
      >
        <motion.path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {pointsData.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hovered === i ? 3 : i === data.length - 1 ? 2.5 : 6}
            fill={hovered === i || i === data.length - 1 ? color : "transparent"}
            stroke="none"
            className="cursor-pointer"
            onMouseEnter={() => setHovered(i)}
          />
        ))}
      </svg>
      <AnimatePresence>
        {hovered !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md whitespace-nowrap pointer-events-none"
          >
            <span className="font-semibold">{monthNames[months[hovered].month]}</span>{" "}
            <span className="tabular-nums">{data[hovered].toFixed(0)} RON</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CategoryTrendsSparkline({ transactions }: CategoryTrendsSparklineProps) {
  const trends = useMemo(() => {
    const now = new Date();
    const months: { month: number; year: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: d.getMonth(), year: d.getFullYear() });
    }

    // Get top expense categories from current month
    const currentMonth = months[months.length - 1];
    const currentExpenses = transactions.filter((t) => {
      const d = new Date(t.date);
      return t.type === "expense" && d.getMonth() === currentMonth.month && d.getFullYear() === currentMonth.year;
    });

    const byCategory: Record<string, number> = {};
    currentExpenses.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });

    const topCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([cat]) => cat);

    return topCategories.map((category) => {
      const monthlyData = months.map(({ month, year }) =>
        transactions
          .filter((t) => {
            const d = new Date(t.date);
            return t.type === "expense" && t.category === category && d.getMonth() === month && d.getFullYear() === year;
          })
          .reduce((s, t) => s + t.amount, 0)
      );

      const current = monthlyData[monthlyData.length - 1];
      const previous = monthlyData[monthlyData.length - 2];
      const changePercent = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

      return {
        category,
        data: monthlyData,
        current,
        changePercent,
        config: getCategoryConfig(category, "expense"),
      };
    });
  }, [transactions]);

  if (trends.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tendințe categorii
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Adaugă tranzacții pentru a vedea tendințele pe categorii.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Tendințe categorii
        </CardTitle>
        <p className="text-xs text-muted-foreground">Ultimele 6 luni</p>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {trends.map((trend, i) => {
            const Icon = trend.config.icon;
            const isUp = trend.changePercent > 5;
            const isDown = trend.changePercent < -5;
            const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
            return (
              <motion.div
                key={trend.category}
                className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, delay: i * 0.06 }}
              >
                <div className="shrink-0 p-1.5 rounded-md" style={{ backgroundColor: trend.config.lightColor }}>
                  <Icon className="h-4 w-4" style={{ color: trend.config.color }} />
                </div>
                <span className="text-sm font-medium truncate flex-1 min-w-0">{trend.category}</span>
                <Sparkline data={trend.data} color={trend.config.color} />
                <div className="flex items-center gap-1 shrink-0 min-w-[60px] justify-end">
                  <TrendIcon
                    className={`h-3 w-3 ${isUp ? "text-destructive" : isDown ? "text-success" : "text-muted-foreground"}`}
                  />
                  <motion.span
                    key={trend.changePercent.toFixed(0)}
                    className={`text-xs font-semibold tabular-nums ${isUp ? "text-destructive" : isDown ? "text-success" : "text-muted-foreground"}`}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {trend.changePercent > 0 ? "+" : ""}
                    {trend.changePercent.toFixed(0)}%
                  </motion.span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
