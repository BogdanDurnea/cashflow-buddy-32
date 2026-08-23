import { describe, it, expect } from "vitest";
import { computeKpi } from "@/lib/kpi";
import type { Transaction } from "@/components/TransactionForm";

const NOW = new Date(2026, 5, 15, 12, 0, 0); // 15 June 2026, 30-day month

let seq = 0;
const tx = (
  type: "income" | "expense",
  amount: number,
  date: Date,
  category = "Test",
): Transaction => ({
  id: `tx-${seq++}`,
  type,
  amount,
  category,
  description: "",
  date,
});

const thisMonth = (day: number) => new Date(2026, 5, day, 10, 0, 0);
const monthsAgo = (m: number, day = 10) => new Date(2026, 5 - m, day, 10, 0, 0);

describe("computeKpi — totals", () => {
  it("returns neutral values with no transactions", () => {
    const kpi = computeKpi([], NOW);
    expect(kpi.income).toBe(0);
    expect(kpi.expense).toBe(0);
    expect(kpi.net).toBe(0);
    expect(kpi.inOutRatio).toBe(50);
    expect(kpi.forecastExpense).toBe(0);
    expect(kpi.score).toBe(15); // only the neutral discipline points
    expect(kpi.level).toBe("risk");
  });

  it("sums income and expenses of the current month only", () => {
    const kpi = computeKpi(
      [
        tx("income", 5000, thisMonth(2)),
        tx("expense", 1200, thisMonth(3)),
        tx("expense", 800, thisMonth(10)),
        tx("income", 9999, monthsAgo(1)),
        tx("expense", 4444, monthsAgo(2)),
      ],
      NOW,
    );
    expect(kpi.income).toBe(5000);
    expect(kpi.expense).toBe(2000);
    expect(kpi.net).toBe(3000);
  });

  it("computes the in/out ratio proportionally", () => {
    const kpi = computeKpi(
      [tx("income", 3000, thisMonth(1)), tx("expense", 1000, thisMonth(2))],
      NOW,
    );
    expect(kpi.inOutRatio).toBeCloseTo(75, 5);
  });

  it("handles an expense-only month (negative net, zero savings rate)", () => {
    const kpi = computeKpi([tx("expense", 500, thisMonth(4))], NOW);
    expect(kpi.net).toBe(-500);
    expect(kpi.savingsRate).toBe(0);
    expect(kpi.inOutRatio).toBe(0);
  });
});

describe("computeKpi — forecast vs actual", () => {
  it("uses the run-rate when there is no history", () => {
    // 1000 spent by day 15 of a 30 day month -> run-rate 2000
    const kpi = computeKpi([tx("expense", 1000, thisMonth(5))], NOW);
    expect(kpi.forecastExpense).toBeCloseTo(2000, 5);
    expect(kpi.expectedToDate).toBeCloseTo(1000, 5);
    expect(kpi.variance).toBeCloseTo(0, 5);
    expect(kpi.paceProgress).toBeCloseTo(50, 5);
  });

  it("blends the 3-month baseline with the run-rate", () => {
    const kpi = computeKpi(
      [
        tx("expense", 1000, thisMonth(5)),
        tx("expense", 3000, monthsAgo(1)),
        tx("expense", 3000, monthsAgo(2)),
        tx("expense", 3000, monthsAgo(3)),
      ],
      NOW,
    );
    // baseline 3000, run-rate 2000 -> forecast 2500
    expect(kpi.forecastExpense).toBeCloseTo(2500, 5);
    expect(kpi.expectedToDate).toBeCloseTo(1250, 5);
    expect(kpi.variance).toBeCloseTo(-250, 5);
    expect(kpi.variancePct).toBeCloseTo(-20, 5);
  });

  it("flags spending above the forecast pace", () => {
    const kpi = computeKpi(
      [tx("expense", 2000, thisMonth(5)), tx("expense", 1000, monthsAgo(1))],
      NOW,
    );
    // baseline 1000, run-rate 4000 -> forecast 2500, expected-to-date 1250
    expect(kpi.variance).toBeGreaterThan(0);
    expect(kpi.variancePct).toBeCloseTo(60, 5);
  });

  it("caps pace progress at 100%", () => {
    const kpi = computeKpi(
      [tx("expense", 5000, thisMonth(2)), tx("expense", 100, monthsAgo(1))],
      NOW,
    );
    expect(kpi.paceProgress).toBeLessThanOrEqual(100);
  });

  it("reports the remaining days of the month", () => {
    expect(computeKpi([], NOW).daysLeft).toBe(15);
    expect(computeKpi([], new Date(2026, 5, 30)).daysLeft).toBe(0);
    expect(computeKpi([], new Date(2026, 1, 1)).daysLeft).toBe(27); // Feb 2026
  });
});

describe("computeKpi — health score 0..100", () => {
  it("stays within bounds across many random portfolios", () => {
    for (let i = 0; i < 200; i++) {
      const list: Transaction[] = [];
      const n = Math.floor(Math.random() * 12);
      for (let j = 0; j < n; j++) {
        list.push(
          tx(
            Math.random() > 0.5 ? "income" : "expense",
            Math.round(Math.random() * 10000) / 100,
            Math.random() > 0.5 ? thisMonth(1 + Math.floor(Math.random() * 15)) : monthsAgo(1 + (j % 3)),
          ),
        );
      }
      const { score } = computeKpi(list, NOW);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(score)).toBe(true);
    }
  });

  it("scores a strong saver as healthy", () => {
    const kpi = computeKpi(
      [tx("income", 10000, thisMonth(1)), tx("expense", 3000, thisMonth(6))],
      NOW,
    );
    expect(kpi.savingsRate).toBeCloseTo(70, 5);
    expect(kpi.score).toBeGreaterThanOrEqual(70);
    expect(kpi.level).toBe("healthy");
  });

  it("scores an overspender as at risk", () => {
    const kpi = computeKpi(
      [
        tx("income", 1000, thisMonth(1)),
        tx("expense", 3000, thisMonth(6)),
        tx("expense", 500, monthsAgo(1)),
      ],
      NOW,
    );
    expect(kpi.net).toBeLessThan(0);
    expect(kpi.score).toBeLessThan(45);
    expect(kpi.level).toBe("risk");
  });

  it("maps score thresholds to the right level", () => {
    const levelOf = (income: number, expense: number) =>
      computeKpi([tx("income", income, thisMonth(1)), tx("expense", expense, thisMonth(2))], NOW)
        .level;
    expect(levelOf(10000, 1000)).toBe("healthy");
    expect(levelOf(1000, 5000)).toBe("risk");
    expect(["healthy", "watch", "risk"]).toContain(levelOf(1000, 850));
  });

  it("increases the score when spending decreases", () => {
    const high = computeKpi(
      [tx("income", 5000, thisMonth(1)), tx("expense", 4000, thisMonth(2))],
      NOW,
    ).score;
    const low = computeKpi(
      [tx("income", 5000, thisMonth(1)), tx("expense", 1000, thisMonth(2))],
      NOW,
    ).score;
    expect(low).toBeGreaterThan(high);
  });
});

describe("computeKpi — data sync", () => {
  it("matches the totals derived from the same transaction list", () => {
    const list = [
      tx("income", 1234.56, thisMonth(1)),
      tx("expense", 234.56, thisMonth(2)),
      tx("expense", 100, thisMonth(3)),
    ];
    const currentMonth = list.filter((t) => t.date.getMonth() === NOW.getMonth());
    const income = currentMonth
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = currentMonth
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);

    const kpi = computeKpi(list, NOW);
    expect(kpi.income).toBeCloseTo(income, 5);
    expect(kpi.expense).toBeCloseTo(expense, 5);
    expect(kpi.net).toBeCloseTo(income - expense, 5);
  });

  it("is stable regardless of transaction ordering", () => {
    const list = [
      tx("income", 900, thisMonth(9)),
      tx("expense", 300, thisMonth(4)),
      tx("expense", 120, monthsAgo(1)),
    ];
    const a = computeKpi(list, NOW);
    const b = computeKpi([...list].reverse(), NOW);
    expect(b).toEqual(a);
  });

  it("accepts ISO string dates coming from the API", () => {
    const iso = [
      { ...tx("income", 500, thisMonth(3)), date: thisMonth(3).toISOString() as unknown as Date },
      { ...tx("expense", 200, thisMonth(4)), date: thisMonth(4).toISOString() as unknown as Date },
    ];
    const kpi = computeKpi(iso, NOW);
    expect(kpi.income).toBe(500);
    expect(kpi.expense).toBe(200);
  });
});
