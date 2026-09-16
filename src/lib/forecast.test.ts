import { describe, it, expect } from "vitest";
import { forecastMonthlySpending } from "./forecast";

const now = new Date(2026, 5, 15); // 15 iunie 2026, jumătatea lunii

describe("forecastMonthlySpending", () => {
  it("returnează rezultat gol fără tranzacții", () => {
    const r = forecastMonthlySpending([], now);
    expect(r.categories).toEqual([]);
    expect(r.totalProjected).toBe(0);
  });

  it("ignoră veniturile", () => {
    const r = forecastMonthlySpending(
      [{ type: "income", amount: 5000, category: "Salariu", date: new Date(2026, 5, 2) }],
      now
    );
    expect(r.categories).toEqual([]);
  });

  it("calculează media pe ultimele 3 luni", () => {
    const r = forecastMonthlySpending(
      [
        { type: "expense", amount: 300, category: "Mâncare", date: new Date(2026, 4, 5) },
        { type: "expense", amount: 300, category: "Mâncare", date: new Date(2026, 3, 5) },
        { type: "expense", amount: 300, category: "Mâncare", date: new Date(2026, 2, 5) },
      ],
      now
    );
    expect(r.categories[0].average).toBe(300);
    expect(r.categories[0].spentSoFar).toBe(0);
  });

  it("proiectează pe baza ritmului curent", () => {
    const r = forecastMonthlySpending(
      [
        { type: "expense", amount: 600, category: "Mâncare", date: new Date(2026, 4, 5) },
        { type: "expense", amount: 300, category: "Mâncare", date: new Date(2026, 5, 10) },
      ],
      now
    );
    const cat = r.categories[0];
    // ritm: 300 / 0.5 = 600; medie: 200 => proiecție (600+200)/2 = 400
    expect(cat.projected).toBeGreaterThanOrEqual(cat.spentSoFar);
    expect(cat.projected).toBeCloseTo(400, 0);
  });

  it("nu proiectează sub suma deja cheltuită", () => {
    const r = forecastMonthlySpending(
      [{ type: "expense", amount: 1000, category: "Chirie", date: new Date(2026, 5, 1) }],
      now
    );
    expect(r.categories[0].projected).toBeGreaterThanOrEqual(1000);
  });

  it("sortează categoriile descrescător după proiecție", () => {
    const r = forecastMonthlySpending(
      [
        { type: "expense", amount: 100, category: "Mic", date: new Date(2026, 5, 3) },
        { type: "expense", amount: 900, category: "Mare", date: new Date(2026, 5, 3) },
      ],
      now
    );
    expect(r.categories.map((c) => c.category)).toEqual(["Mare", "Mic"]);
  });

  it("calculează progresul lunii", () => {
    const r = forecastMonthlySpending([], new Date(2026, 5, 30));
    expect(r.monthProgress).toBe(1);
  });

  it("acceptă date ca string", () => {
    const r = forecastMonthlySpending(
      [{ type: "expense", amount: 50, category: "Test", date: "2026-06-05T10:00:00Z" }],
      now
    );
    expect(r.totalSpent).toBe(50);
  });
});
