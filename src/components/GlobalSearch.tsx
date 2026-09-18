import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { Transaction } from "./TransactionForm";

interface GlobalSearchProps {
  transactions: Transaction[];
  onSelect?: (transaction: Transaction) => void;
}

export function searchTransactions(transactions: Transaction[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const numeric = Number(q.replace(",", "."));
  return transactions.filter((t) => {
    if (t.description?.toLowerCase().includes(q)) return true;
    if (t.category.toLowerCase().includes(q)) return true;
    if (t.tags?.some((tag) => tag.toLowerCase().includes(q))) return true;
    if (!Number.isNaN(numeric) && q.length > 0 && String(t.amount).includes(q)) return true;
    return false;
  });
}

export function GlobalSearch({ transactions, onSelect }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchTransactions(transactions, query), [transactions, query]);

  const format = (n: number) =>
    new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON" }).format(n);

  return (
    <Card className="shadow-card">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Search className="h-4 w-4 text-primary" aria-hidden="true" />
          Căutare globală
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="relative">
          <label htmlFor="global-search" className="sr-only">
            Caută tranzacții după descriere, sumă, categorie sau etichetă
          </label>
          <Input
            id="global-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Caută după descriere, sumă, categorie sau etichetă..."
            className="pr-9"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Șterge căutarea"
              onClick={() => setQuery("")}
              className="absolute right-1 top-1 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {query.trim() && (
          <p className="text-xs text-muted-foreground" role="status">
            {results.length} rezultate
          </p>
        )}

        {results.length > 0 && (
          <ScrollArea className="h-[260px] rounded-md border">
            <ul className="divide-y">
              {results.slice(0, 100).map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => onSelect?.(t)}
                    className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-muted/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{t.category}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {t.description || "—"} · {new Date(t.date).toLocaleDateString("ro-RO")}
                      </span>
                      {t.tags && t.tags.length > 0 && (
                        <span className="mt-1 flex flex-wrap gap-1">
                          {t.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                        </span>
                      )}
                    </span>
                    <span
                      className={`shrink-0 text-sm font-semibold ${
                        t.type === "income" ? "text-success" : "text-danger"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {format(t.amount)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
