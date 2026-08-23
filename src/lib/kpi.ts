import type { Transaction } from "@/components/TransactionForm";

export type HealthLevel = "healthy" | "watch" | "risk";

export interface KpiResult {
  income: number;
  expense: number;
  net: number;
  savingsRate: number;
  score: number;
  level: HealthLevel;
  inOutRatio: number;
  forecastExpense: number;
  expectedToDate: number;
  variance: number;
  variancePct: number;
  paceProgress: number;
  daysLeft: number;
}

const sum = (items: Transaction[]) => items.reduce((s, tx) => s + tx.amount, 0);

const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

/**
 * Pure KPI calculation shared by the dashboard widgets and the test-suite.
 * `now` is injectable so tests are deterministic.
 */
export function computeKpi(transactions: Transaction[], now: Date = new Date()): KpiResult {
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const inMonth = (offset: number) => {
    const ref = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = monthKey(ref);
    return transactions.filter((tx) => monthKey(new Date(tx.date)) === key);
  };

  const current = inMonth(0);
  const income = sum(current.filter((tx) => tx.type === "income"));
  const expense = sum(current.filter((tx) => tx.type === "expense"));
  const net = income - expense;

  // Baseline: average monthly expense over the last 3 complete months.
  const previous = [1, 2, 3].map((o) => inMonth(o));
  const monthsWithData = previous.filter((m) => m.length > 0);
  const baselineExpense = monthsWithData.length
    ? monthsWithData.reduce((s, m) => s + sum(m.filter((tx) => tx.type === "expense")), 0) /
      monthsWithData.length
    : 0;

  // Forecast: blend the historical baseline with the current run-rate so the
  // number reacts to this month's pace without over-reacting on day 1.
  const runRate = dayOfMonth > 0 ? (expense / dayOfMonth) * daysInMonth : 0;
  const forecastExpense = baselineExpense > 0 ? baselineExpense * 0.5 + runRate * 0.5 : runRate;
  const expectedToDate = (forecastExpense / daysInMonth) * dayOfMonth;
  const variance = expense - expectedToDate;
  const variancePct = expectedToDate > 0 ? (variance / expectedToDate) * 100 : 0;
  const paceProgress = forecastExpense > 0 ? Math.min((expense / forecastExpense) * 100, 100) : 0;

  // Health score: savings rate (0-50) + spend discipline vs forecast (0-30)
  // + income coverage of expenses (0-20).
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
  const savingsPoints = Math.max(0, Math.min(50, (savingsRate / 30) * 50));
  const disciplinePoints = expectedToDate > 0
    ? Math.max(0, Math.min(30, 30 - (variancePct / 25) * 30))
    : 15;
  const coverage = expense > 0 ? income / expense : income > 0 ? 2 : 0;
  const coveragePoints = Math.max(0, Math.min(20, (coverage / 1.5) * 20));
  const score = Math.round(savingsPoints + disciplinePoints + coveragePoints);

  const level: HealthLevel = score >= 70 ? "healthy" : score >= 45 ? "watch" : "risk";

  const inOutRatio = income + expense > 0 ? (income / (income + expense)) * 100 : 50;

  return {
    income,
    expense,
    net,
    savingsRate,
    score,
    level,
    inOutRatio,
    forecastExpense,
    expectedToDate,
    variance,
    variancePct,
    paceProgress,
    daysLeft: daysInMonth - dayOfMonth,
  };
}
