import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { incomeCategories, expenseCategories } from "@/lib/categoryConfig";

interface TransactionFiltersProps {
  selectedType: "all" | "income" | "expense";
  selectedCategory: string;
  selectedPeriod: string;
  onTypeChange: (type: "all" | "income" | "expense") => void;
  onCategoryChange: (category: string) => void;
  onPeriodChange: (period: string) => void;
  onReset: () => void;
}

export function TransactionFilters({
  selectedType,
  selectedCategory,
  selectedPeriod,
  onTypeChange,
  onCategoryChange,
  onPeriodChange,
  onReset
}: TransactionFiltersProps) {
  const allCategories = [...incomeCategories, ...expenseCategories].map(c => c.name);
  const uniqueCategories = Array.from(new Set(allCategories));

  const hasActiveFilters = selectedType !== "all" || selectedCategory !== "all" || selectedPeriod !== "all";

  return (
    <Card className="shadow-card">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Filtrează tranzacțiile</h3>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Resetează
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="filter-type" className="text-xs">Tip</Label>
            <Select value={selectedType} onValueChange={onTypeChange}>
              <SelectTrigger id="filter-type" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="income">Venituri</SelectItem>
                <SelectItem value="expense">Cheltuieli</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="filter-category" className="text-xs">Categorie</Label>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger id="filter-category" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate categoriile</SelectItem>
                {uniqueCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="filter-period" className="text-xs">Perioadă</Label>
            <Select value={selectedPeriod} onValueChange={onPeriodChange}>
              <SelectTrigger id="filter-period" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate perioadele</SelectItem>
                <SelectItem value="today">Astăzi</SelectItem>
                <SelectItem value="week">Ultima săptămână</SelectItem>
                <SelectItem value="month">Luna curentă</SelectItem>
                <SelectItem value="3months">Ultimele 3 luni</SelectItem>
                <SelectItem value="year">Anul curent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
