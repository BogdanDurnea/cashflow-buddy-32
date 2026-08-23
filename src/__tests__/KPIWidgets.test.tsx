import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/i18n/locales/en.json";
import { KPIWidgets } from "@/components/KPIWidgets";
import { computeKpi } from "@/lib/kpi";
import type { Transaction } from "@/components/TransactionForm";

const NOW = new Date(2026, 5, 15, 12, 0, 0);

let seq = 0;
const tx = (type: "income" | "expense", amount: number, day: number, monthOffset = 0): Transaction => ({
  id: `tx-${seq++}`,
  type,
  amount,
  category: type === "income" ? "Salary" : "Groceries",
  description: "",
  date: new Date(2026, 5 - monthOffset, day, 10, 0, 0),
});

beforeAll(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      lng: "en",
      fallbackLng: "en",
      resources: { en: { translation: en } },
      interpolation: { escapeValue: false },
    });
  }
});

afterAll(() => {
  vi.useRealTimers();
});

const TRANSACTIONS: Transaction[] = [
  tx("income", 10000, 1),
  tx("expense", 1500, 5),
  tx("expense", 500, 9),
  tx("expense", 4000, 12, 1),
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

describe("KPIWidgets rendering", () => {
  it("renders all three KPI cards", () => {
    render(<KPIWidgets transactions={TRANSACTIONS} />);
    expect(screen.getByText(en.kpi.healthTitle)).toBeInTheDocument();
    expect(screen.getByText(en.kpi.cashInOutTitle)).toBeInTheDocument();
    expect(screen.getByText(en.kpi.forecastTitle)).toBeInTheDocument();
  });

  it("shows the health score out of 100 with a matching progress bar", () => {
    const expected = computeKpi(TRANSACTIONS, NOW);
    render(<KPIWidgets transactions={TRANSACTIONS} />);

    expect(screen.getByText(String(expected.score))).toBeInTheDocument();
    expect(screen.getByText("/100")).toBeInTheDocument();

    const bar = screen.getByLabelText(en.kpi.healthTitle);
    expect(bar).toBeInTheDocument();
    expect(expected.score).toBeGreaterThanOrEqual(0);
    expect(expected.score).toBeLessThanOrEqual(100);
  });

  it("shows the level badge matching the computed level", () => {
    const expected = computeKpi(TRANSACTIONS, NOW);
    render(<KPIWidgets transactions={TRANSACTIONS} />);
    expect(screen.getByText(en.kpi.level[expected.level])).toBeInTheDocument();
  });

  it("renders the empty-state score without crashing", () => {
    const expected = computeKpi([], NOW);
    render(<KPIWidgets transactions={[]} />);
    expect(screen.getByText(String(expected.score))).toBeInTheDocument();
    expect(screen.getByText("/100")).toBeInTheDocument();
  });

  it("displays income, expense and net cash flow of the current month", () => {
    const expected = computeKpi(TRANSACTIONS, NOW);
    render(<KPIWidgets transactions={TRANSACTIONS} />);

    expect(screen.getAllByText(new RegExp(fmt(expected.income)))[0]).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(fmt(expected.expense)))[0]).toBeInTheDocument();

    const net = screen.getByText(fmt(expected.net), { exact: false });
    expect(net).toBeInTheDocument();
  });

  it("shows actual to date and month-end forecast", () => {
    const expected = computeKpi(TRANSACTIONS, NOW);
    render(<KPIWidgets transactions={TRANSACTIONS} />);

    expect(screen.getByText(en.kpi.actualToDate)).toBeInTheDocument();
    expect(screen.getByText(en.kpi.forecastMonthEnd)).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(fmt(expected.forecastExpense)))[0]).toBeInTheDocument();
  });

  it("shows the correct above/below forecast wording", () => {
    const overspending: Transaction[] = [tx("expense", 5000, 3), tx("expense", 500, 12, 1)];
    const expected = computeKpi(overspending, NOW);
    expect(expected.variance).toBeGreaterThan(0);

    render(<KPIWidgets transactions={overspending} />);
    expect(screen.getByText(/above forecast pace/i)).toBeInTheDocument();
    expect(screen.queryByText(/below forecast pace/i)).not.toBeInTheDocument();
  });

  it("shows the number of days left in the month", () => {
    render(<KPIWidgets transactions={TRANSACTIONS} />);
    expect(screen.getByText(/15 days left/i)).toBeInTheDocument();
  });
});

describe("KPIWidgets sync with the displayed transaction data", () => {
  it("recomputes when the transaction list changes", () => {
    const { rerender } = render(<KPIWidgets transactions={TRANSACTIONS} />);
    const before = computeKpi(TRANSACTIONS, NOW);
    expect(screen.getByText(String(before.score))).toBeInTheDocument();

    const updated = [...TRANSACTIONS, tx("expense", 6000, 14)];
    rerender(<KPIWidgets transactions={updated} />);

    const after = computeKpi(updated, NOW);
    expect(after.score).toBeLessThan(before.score);
    expect(screen.getByText(String(after.score))).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(fmt(after.expense)))[0]).toBeInTheDocument();
  });

  it("keeps the cash-in/cash-out figures equal to the sum of the listed transactions", () => {
    render(<KPIWidgets transactions={TRANSACTIONS} />);

    const currentMonth = TRANSACTIONS.filter((t) => t.date.getMonth() === NOW.getMonth());
    const income = currentMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = currentMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    const card = screen.getByText(en.kpi.cashInOutTitle).closest("div")?.parentElement as HTMLElement;
    expect(within(card).getAllByText(new RegExp(fmt(income)))[0]).toBeInTheDocument();
    expect(within(card).getAllByText(new RegExp(fmt(expense)))[0]).toBeInTheDocument();
  });

  it("ignores transactions from previous months in the current-month figures", () => {
    const onlyOld = [tx("income", 999, 10, 2), tx("expense", 555, 11, 2)];
    render(<KPIWidgets transactions={onlyOld} />);
    expect(screen.queryByText(/999/)).not.toBeInTheDocument();
    expect(screen.queryByText(/555/)).not.toBeInTheDocument();
  });
});
