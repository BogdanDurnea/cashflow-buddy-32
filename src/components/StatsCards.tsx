import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Activity, Calendar, PiggyBank } from "lucide-react";
import { Transaction } from "@/components/TransactionForm";
import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface StatsCardsProps {
  transactions: Transaction[];
}

export const StatsCards = React.memo(function StatsCards({ transactions }: StatsCardsProps) {
  const { t, i18n } = useTranslation();
  const currency = t("common.currency");

  // Calculate statistics
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Current month calculations
  const now = new Date();
  const currentMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = currentMonthTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Daily average (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
  const recentExpenses = recentTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const dailyAverage = recentExpenses / 30;

  // Savings rate
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100 : 0;

  // Projection for end of month
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projectedExpenses = (monthlyExpense / dayOfMonth) * daysInMonth;

  // Format numbers using Intl
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat(i18n.language, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const monthName = new Intl.DateTimeFormat(i18n.language, { month: 'long' }).format(now);

  const stats = [
    {
      title: t("stats.totalBalance"),
      value: `${formatAmount(balance)} ${currency}`,
      icon: DollarSign,
      trend: balance >= 0 ? "positive" : "negative",
      description: t("stats.incomeMinusExpenses", { 
        income: formatAmount(totalIncome), 
        expenses: formatAmount(totalExpense) 
      }),
    },
    {
      title: t("stats.currentMonth"),
      value: `${formatAmount(monthlyIncome - monthlyExpense)} ${currency}`,
      icon: Calendar,
      trend: (monthlyIncome - monthlyExpense) >= 0 ? "positive" : "negative",
      description: t("stats.incomeMinusExpenses", { 
        income: formatAmount(monthlyIncome), 
        expenses: formatAmount(monthlyExpense) 
      }),
    },
    {
      title: t("stats.dailyAverage"),
      value: `${formatAmount(dailyAverage)} ${currency}`,
      icon: Activity,
      trend: "neutral",
      description: t("stats.averageExpensesLast30Days"),
    },
    {
      title: t("stats.savingsRate"),
      value: `${savingsRate.toFixed(1)}%`,
      icon: PiggyBank,
      trend: savingsRate >= 20 ? "positive" : savingsRate >= 10 ? "neutral" : "negative",
      description: monthlyIncome > 0 ? t("stats.fromMonthlyIncome") : t("stats.noIncomeRecorded"),
    },
    {
      title: t("stats.monthlyProjection"),
      value: `${formatAmount(projectedExpenses)} ${currency}`,
      icon: TrendingUp,
      trend: projectedExpenses <= monthlyIncome ? "positive" : "negative",
      description: t("stats.estimatedExpensesUntil", { day: daysInMonth, month: monthName }),
    },
    {
      title: t("stats.largestExpense"),
      value: transactions.filter(t => t.type === "expense").length > 0
        ? `${formatAmount(Math.max(...transactions.filter(t => t.type === "expense").map(t => t.amount)))} ${currency}`
        : `0.00 ${currency}`,
      icon: TrendingDown,
      trend: "neutral",
      description: currentMonthTransactions.filter(t => t.type === "expense").length > 0
        ? t("stats.currentMonthAmount", { 
            amount: formatAmount(Math.max(...currentMonthTransactions.filter(t => t.type === "expense").map(t => t.amount), 0)), 
            currency 
          })
        : t("stats.noExpensesThisMonth"),
    },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.08,
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    })
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={index}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card className="shadow-card transition-smooth hover:shadow-lg active:scale-[0.98] h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <div className={`text-xl sm:text-2xl font-bold break-words ${
                  stat.trend === "positive" ? "text-success" :
                  stat.trend === "negative" ? "text-danger" :
                  "text-foreground"
                }`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
});
