import type { Transaction } from "@/components/TransactionForm";

export type BankFormat = "bt" | "revolut" | "ing" | "generic";

export interface ParsedRow {
  date: Date;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  currency: string;
}

/** Împarte o linie CSV respectând ghilimelele. */
export function splitCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

export function detectDelimiter(headerLine: string): string {
  const candidates = [",", ";", "\t"];
  return candidates
    .map((d) => ({ d, n: splitCsvLine(headerLine, d).length }))
    .sort((a, b) => b.n - a.n)[0].d;
}

export function detectBankFormat(headers: string[]): BankFormat {
  const h = headers.map((x) => x.toLowerCase());
  const has = (s: string) => h.some((x) => x.includes(s));

  if (has("started date") || has("completed date")) return "revolut";
  if (has("data inregistrare") || has("suma debit") || has("suma credit")) return "bt";
  if (has("data tranzactie") && (has("debit") || has("credit"))) return "ing";
  return "generic";
}

/** Acceptă 1.234,56 / 1,234.56 / -12.5 / "12,50 RON" */
export function parseAmount(raw: string): number {
  if (!raw) return NaN;
  let s = raw.replace(/[^\d,.\-]/g, "").trim();
  if (!s) return NaN;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}

/** Acceptă dd.mm.yyyy, dd/mm/yyyy, yyyy-mm-dd (opțional cu oră). */
export function parseDate(raw: string): Date | null {
  if (!raw) return null;
  const s = raw.trim();

  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Mâncare: ["lidl", "kaufland", "carrefour", "mega image", "profi", "penny", "auchan", "glovo", "tazz", "restaurant", "food"],
  Transport: ["omv", "petrom", "rompetrol", "mol", "uber", "bolt", "stb", "cfr", "benzin", "parcare"],
  Utilități: ["enel", "eon", "electrica", "digi", "orange", "vodafone", "telekom", "apa nova", "engie", "gaz"],
  Sănătate: ["farmac", "catena", "sensiblu", "help net", "regina maria", "medlife", "spital", "clinic"],
  Divertisment: ["netflix", "spotify", "hbo", "steam", "cinema", "youtube", "disney"],
  Shopping: ["emag", "altex", "decathlon", "zara", "h&m", "ikea", "amazon", "pepco"],
  Salariu: ["salar", "salary", "lichidare", "avans salar"],
  Economii: ["transfer economii", "depozit", "savings"],
};

export function guessCategory(description: string, type: "income" | "expense"): string {
  const d = description.toLowerCase();
  for (const [category, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some((w) => d.includes(w))) return category;
  }
  return type === "income" ? "Alte venituri" : "Altele";
}

interface ColumnMap {
  date: number;
  description: number;
  amount: number;
  debit: number;
  credit: number;
  currency: number;
}

function mapColumns(headers: string[]): ColumnMap {
  const h = headers.map((x) => x.toLowerCase());
  const find = (...keys: string[]) =>
    h.findIndex((x) => keys.some((k) => x.includes(k)));

  return {
    date: find("completed date", "started date", "data inregistrare", "data tranzactie", "data", "date"),
    description: find("descriere", "description", "detalii", "explicatii", "beneficiar", "merchant"),
    amount: h.findIndex(
      (x) =>
        !x.includes("debit") &&
        !x.includes("credit") &&
        ["amount", "suma", "valoare"].some((k) => x.includes(k))
    ),

    debit: find("suma debit", "debit"),
    credit: find("suma credit", "credit"),
    currency: find("currency", "valuta", "moneda"),
  };
}

export interface BankParseResult {
  format: BankFormat;
  rows: ParsedRow[];
  skipped: number;
}

/** Parsează un extras bancar CSV (BT, Revolut, ING sau generic). */
export function parseBankStatement(text: string): BankParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error("Fișier CSV invalid sau gol");

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter);
  const format = detectBankFormat(headers);
  const cols = mapColumns(headers);

  if (cols.date === -1 || (cols.amount === -1 && cols.debit === -1 && cols.credit === -1)) {
    throw new Error("Nu am găsit coloanele de dată și sumă în extras");
  }

  const rows: ParsedRow[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i], delimiter);
    const date = parseDate(values[cols.date] ?? "");

    let amount = NaN;
    if (cols.amount !== -1) amount = parseAmount(values[cols.amount] ?? "");
    if (Number.isNaN(amount) && cols.debit !== -1) {
      const debit = parseAmount(values[cols.debit] ?? "");
      if (Number.isFinite(debit) && debit !== 0) amount = -Math.abs(debit);
    }
    if (Number.isNaN(amount) && cols.credit !== -1) {
      const credit = parseAmount(values[cols.credit] ?? "");
      if (Number.isFinite(credit) && credit !== 0) amount = Math.abs(credit);
    }

    if (!date || !Number.isFinite(amount) || amount === 0) {
      skipped++;
      continue;
    }

    const description =
      cols.description !== -1 ? (values[cols.description] ?? "").trim() : "";
    const type: "income" | "expense" = amount > 0 ? "income" : "expense";

    rows.push({
      date,
      description,
      amount: Math.abs(amount),
      type,
      category: guessCategory(description, type),
      currency: (cols.currency !== -1 ? values[cols.currency] : "")?.toUpperCase() || "RON",
    });
  }

  if (rows.length === 0) throw new Error("Nu s-au găsit tranzacții valide în extras");

  return { format, rows, skipped };
}

export function toTransactions(rows: ParsedRow[]): Transaction[] {
  const stamp = Date.now();
  return rows.map((r, i) => ({
    id: `import-${stamp}-${i}`,
    type: r.type,
    amount: r.amount,
    category: r.category,
    description: r.description,
    date: r.date,
    currency: r.currency,
    exchange_rate: 1,
  }));
}

export const BANK_FORMAT_LABELS: Record<BankFormat, string> = {
  bt: "Banca Transilvania",
  revolut: "Revolut",
  ing: "ING",
  generic: "CSV generic",
};
