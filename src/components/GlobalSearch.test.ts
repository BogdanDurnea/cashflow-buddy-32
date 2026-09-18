import { describe, it, expect } from "vitest";
import { searchTransactions } from "./GlobalSearch";
import type { Transaction } from "./TransactionForm";

const tx = (over: Partial<Transaction>): Transaction => ({
  id: over.id ?? "1",
  type: over.type ?? "expense",
  amount: over.amount ?? 100,
  category: over.category ?? "Mâncare",
  description: over.description ?? "",
  date: over.date ?? new Date("2026-01-10"),
  tags: over.tags,
});

describe("searchTransactions", () => {
  const data = [
    tx({ id: "1", category: "Mâncare", description: "Kaufland", amount: 250.5 }),
    tx({ id: "2", category: "Transport", description: "Benzina", amount: 300, tags: ["masina"] }),
    tx({ id: "3", type: "income", category: "Salariu", description: "Luna ianuarie", amount: 5200 }),
  ];

  it("returnează gol pentru interogare goală", () => {
    expect(searchTransactions(data, "   ")).toEqual([]);
  });

  it("caută după descriere", () => {
    expect(searchTransactions(data, "kaufland").map(t => t.id)).toEqual(["1"]);
  });

  it("caută după categorie", () => {
    expect(searchTransactions(data, "transport").map(t => t.id)).toEqual(["2"]);
  });

  it("caută după etichetă", () => {
    expect(searchTransactions(data, "masina").map(t => t.id)).toEqual(["2"]);
  });

  it("caută după sumă", () => {
    expect(searchTransactions(data, "5200").map(t => t.id)).toEqual(["3"]);
  });

  it("este insensibil la majuscule", () => {
    expect(searchTransactions(data, "BENZINA").map(t => t.id)).toEqual(["2"]);
  });
});
