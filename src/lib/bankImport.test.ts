import { describe, it, expect } from "vitest";
import {
  splitCsvLine,
  detectDelimiter,
  detectBankFormat,
  parseAmount,
  parseDate,
  guessCategory,
  parseBankStatement,
  toTransactions,
} from "./bankImport";

describe("splitCsvLine", () => {
  it("respectă ghilimelele", () => {
    expect(splitCsvLine('a,"b,c",d', ",")).toEqual(["a", "b,c", "d"]);
  });
  it("tratează ghilimelele duble", () => {
    expect(splitCsvLine('"a""b",c', ",")).toEqual(['a"b', "c"]);
  });
});

describe("detectDelimiter", () => {
  it("detectează punct și virgulă", () => {
    expect(detectDelimiter("data;suma;descriere")).toBe(";");
  });
  it("detectează virgulă", () => {
    expect(detectDelimiter("date,amount,description")).toBe(",");
  });
});

describe("parseAmount", () => {
  it("format românesc", () => expect(parseAmount("1.234,56")).toBe(1234.56));
  it("format englezesc", () => expect(parseAmount("1,234.56")).toBe(1234.56));
  it("negativ cu valută", () => expect(parseAmount("-12,50 RON")).toBe(-12.5));
  it("gol", () => expect(Number.isNaN(parseAmount(""))).toBe(true));
});

describe("parseDate", () => {
  it("ISO", () => expect(parseDate("2026-02-10")?.getMonth()).toBe(1));
  it("dd.mm.yyyy", () => {
    const d = parseDate("10.02.2026")!;
    expect([d.getDate(), d.getMonth(), d.getFullYear()]).toEqual([10, 1, 2026]);
  });
  it("invalid", () => expect(parseDate("xyz")).toBeNull());
});

describe("detectBankFormat", () => {
  it("revolut", () => expect(detectBankFormat(["Type", "Started Date", "Amount"])).toBe("revolut"));
  it("bt", () => expect(detectBankFormat(["Data inregistrare", "Suma debit", "Suma credit"])).toBe("bt"));
  it("generic", () => expect(detectBankFormat(["data", "suma"])).toBe("generic"));
});

describe("guessCategory", () => {
  it("mapează magazinele", () => expect(guessCategory("LIDL BUCURESTI", "expense")).toBe("Mâncare"));
  it("mapează utilitățile", () => expect(guessCategory("PLATA DIGI", "expense")).toBe("Utilități"));
  it("fallback venit", () => expect(guessCategory("ceva", "income")).toBe("Alte venituri"));
});

describe("parseBankStatement", () => {
  it("parsează extras Revolut", () => {
    const csv = [
      "Type,Started Date,Description,Amount,Currency",
      "CARD_PAYMENT,2026-01-05 10:00:00,Spotify,-24.99,RON",
      "TOPUP,2026-01-06 09:00:00,Salariu ianuarie,5000,RON",
    ].join("\n");
    const res = parseBankStatement(csv);
    expect(res.format).toBe("revolut");
    expect(res.rows).toHaveLength(2);
    expect(res.rows[0]).toMatchObject({ type: "expense", amount: 24.99, category: "Divertisment" });
    expect(res.rows[1]).toMatchObject({ type: "income", amount: 5000, category: "Salariu" });
  });

  it("parsează extras BT cu debit/credit", () => {
    const csv = [
      "Data inregistrare;Descriere;Suma debit;Suma credit",
      "05.01.2026;KAUFLAND SRL;150,25;",
      "06.01.2026;Transfer primit;;1.000,00",
    ].join("\n");
    const res = parseBankStatement(csv);
    expect(res.format).toBe("bt");
    expect(res.rows[0]).toMatchObject({ type: "expense", amount: 150.25, category: "Mâncare" });
    expect(res.rows[1]).toMatchObject({ type: "income", amount: 1000 });
  });

  it("ignoră rândurile invalide", () => {
    const csv = ["date,description,amount", "bad,foo,bar", "2026-01-05,OMV,-100"].join("\n");
    const res = parseBankStatement(csv);
    expect(res.rows).toHaveLength(1);
    expect(res.skipped).toBe(1);
    expect(res.rows[0].category).toBe("Transport");
  });

  it("aruncă eroare pentru fișier gol", () => {
    expect(() => parseBankStatement("date,amount")).toThrow();
  });

  it("aruncă eroare când lipsesc coloanele", () => {
    expect(() => parseBankStatement("foo,bar\n1,2")).toThrow();
  });
});

describe("toTransactions", () => {
  it("convertește rândurile în tranzacții", () => {
    const rows = parseBankStatement("date,description,amount\n2026-01-05,OMV,-100").rows;
    const tx = toTransactions(rows);
    expect(tx[0]).toMatchObject({ type: "expense", amount: 100, currency: "RON", exchange_rate: 1 });
    expect(tx[0].id).toContain("import-");
  });
});
