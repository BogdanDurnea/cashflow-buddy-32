export interface ForecastInput {
  type: "income" | "expense";
  amount: number;
  category: string;
  date: Date | string;
}

export interface CategoryForecast {
  category: string;
  average: number;
  spentSoFar: number;
  projected: number;
  /** Diferența dintre proiecție și media istorică */
  diff: number;
}

export interface ForecastResult {
  categories: CategoryForecast[];
  totalAverage: number;
  totalSpent: number;
  totalProjected: number;
  monthProgress: number;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

/**
 * Estimează cheltuielile lunii curente pe categorii, folosind media
 * ultimelor `months` luni complete și progresul lunii curente.
 */
export function forecastMonthlySpending(
  transactions: ForecastInput[],
  now: Date = new Date(),
  months = 3
): ForecastResult {
  const currentKey = monthKey(now);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProgress = Math.min(1, now.getDate() / daysInMonth);

  const pastKeys: string[] = [];
  for (let i = 1; i <= months; i++) {
    pastKeys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }

  const pastTotals = new Map<string, number[]>();
  const currentTotals = new Map<string, number>();

  for (const t of transactions) {
    if (t.type !== "expense") continue;
    const d = t.date instanceof Date ? t.date : new Date(t.date);
    const key = monthKey(d);
    if (key === currentKey) {
      currentTotals.set(t.category, (currentTotals.get(t.category) ?? 0) + t.amount);
    } else if (pastKeys.includes(key)) {
      const arr = pastTotals.get(t.category) ?? new Array(months).fill(0);
      arr[pastKeys.indexOf(key)] += t.amount;
      pastTotals.set(t.category, arr);
    }
  }

  const categories = new Set<string>([...pastTotals.keys(), ...currentTotals.keys()]);
  const result: CategoryForecast[] = [];

  categories.forEach((category) => {
    const past = pastTotals.get(category) ?? [];
    const average = past.length ? past.reduce((a, b) => a + b, 0) / months : 0;
    const spentSoFar = currentTotals.get(category) ?? 0;
    // Proiecție: extrapolăm ritmul curent, dar nu sub cheltuiala deja făcută
    const paceProjection = monthProgress > 0 ? spentSoFar / monthProgress : spentSoFar;
    const projected = Math.max(
      spentSoFar,
      average > 0 ? (paceProjection + average) / 2 : paceProjection
    );
    result.push({
      category,
      average: round(average),
      spentSoFar: round(spentSoFar),
      projected: round(projected),
      diff: round(projected - average),
    });
  });

  result.sort((a, b) => b.projected - a.projected);

  return {
    categories: result,
    totalAverage: round(result.reduce((s, c) => s + c.average, 0)),
    totalSpent: round(result.reduce((s, c) => s + c.spentSoFar, 0)),
    totalProjected: round(result.reduce((s, c) => s + c.projected, 0)),
    monthProgress,
  };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
