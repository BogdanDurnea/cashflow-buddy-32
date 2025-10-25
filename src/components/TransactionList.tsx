import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Calendar, Edit2 } from "lucide-react";
import { Transaction } from "./TransactionForm";
import { getCategoryConfig } from "@/lib/categoryConfig";

interface TransactionListProps {
  transactions: Transaction[];
  onEditTransaction: (transaction: Transaction) => void;
}

export function TransactionList({ transactions, onEditTransaction }: TransactionListProps) {
  const sortedTransactions = transactions.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ro-RO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON'
    }).format(amount);
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Tranzacții recente</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {sortedTransactions.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              Nu există tranzacții încă. Adaugă prima ta tranzacție!
            </div>
          ) : (
            <div className="space-y-1">
              {sortedTransactions.map((transaction) => {
                const categoryConfig = getCategoryConfig(transaction.category, transaction.type);
                const CategoryIcon = categoryConfig.icon;
                
                return (
                  <div key={transaction.id} className="p-4 hover:bg-muted/50 transition-smooth">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div 
                          className="p-2 rounded-full"
                          style={{
                            backgroundColor: categoryConfig.lightColor,
                            color: categoryConfig.color
                          }}
                        >
                          <CategoryIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{transaction.category}</span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                transaction.type === "income" 
                                  ? "border-success text-success" 
                                  : "border-danger text-danger"
                              }`}
                            >
                              {transaction.type === "income" ? "Venit" : "Cheltuială"}
                            </Badge>
                          </div>
                        {transaction.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {transaction.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(transaction.date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`font-semibold ${
                        transaction.type === "income" ? "text-success" : "text-danger"
                      }`}>
                        {transaction.type === "income" ? "+" : "-"}
                        {formatAmount(transaction.amount)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditTransaction(transaction)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                    </div>
                    <Separator className="mt-4" />
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}