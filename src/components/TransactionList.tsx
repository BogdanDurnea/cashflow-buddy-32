import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Calendar, Edit2, Paperclip, ExternalLink, Receipt } from "lucide-react";
import { Transaction } from "./TransactionForm";
import { getCategoryConfig } from "@/lib/categoryConfig";
import { EmptyState } from "./EmptyState";
import React from "react";
import { motion } from "framer-motion";

interface TransactionListProps {
  transactions: Transaction[];
  onEditTransaction: (transaction: Transaction) => void;
}

export const TransactionList = React.memo(function TransactionList({ transactions, onEditTransaction }: TransactionListProps) {
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

  const formatAmount = (amount: number, currency: string = 'RON', exchangeRate: number = 1) => {
    const ronAmount = amount * exchangeRate;
    const formatted = new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON'
    }).format(ronAmount);

    if (currency !== 'RON') {
      return `${formatted} (${amount.toFixed(2)} ${currency})`;
    }
    return formatted;
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    })
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="shadow-card transition-smooth">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Tranzacții recente</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sortedTransactions.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={Receipt}
                title="Nicio tranzacție"
                description="Nu ai adăugat încă nicio tranzacție. Începe prin a adăuga prima ta tranzacție pentru a urmări cheltuielile și veniturile."
              />
            </div>
          ) : (
          <ScrollArea className="h-[400px] sm:h-[450px]">
              <div className="space-y-1">
                {sortedTransactions.map((transaction, index) => {
                  const categoryConfig = getCategoryConfig(transaction.category, transaction.type);
                  const CategoryIcon = categoryConfig.icon;
                  
                  return (
                    <motion.div
                      key={transaction.id}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      variants={itemVariants}
                      className="p-3 sm:p-4 hover:bg-muted/50 transition-smooth active:bg-muted/70"
                    >
                    <div className="flex items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <div 
                          className="p-1.5 sm:p-2 rounded-full shrink-0"
                          style={{
                            backgroundColor: categoryConfig.lightColor,
                            color: categoryConfig.color
                          }}
                        >
                          <CategoryIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm sm:text-base truncate">{transaction.category}</span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs shrink-0 ${
                                transaction.type === "income" 
                                  ? "border-success text-success" 
                                  : "border-danger text-danger"
                              }`}
                            >
                              {transaction.type === "income" ? "Venit" : "Cheltuială"}
                            </Badge>
                          </div>
                        {transaction.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                            {transaction.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>{formatDate(transaction.date)}</span>
                          </div>
                          {transaction.attachment_url && (
                            <>
                              <span className="mx-1">•</span>
                              <Paperclip className="h-3 w-3 shrink-0" />
                              <a 
                                href={transaction.attachment_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:underline flex items-center gap-1 active:scale-95 transition-smooth"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Chitanță
                                <ExternalLink className="h-2 w-2" />
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`font-semibold text-sm sm:text-base whitespace-nowrap ${
                        transaction.type === "income" ? "text-success" : "text-danger"
                      }`}>
                        {transaction.type === "income" ? "+" : "-"}
                        {formatAmount(
                          transaction.amount, 
                          transaction.currency, 
                          transaction.exchange_rate
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditTransaction(transaction)}
                        className="h-9 w-9 sm:h-8 sm:w-8 p-0 active:scale-95 transition-smooth shrink-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                      </div>
                      <Separator className="mt-3 sm:mt-4" />
                    </motion.div>
                  );
                })}
              </div>
          </ScrollArea>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});