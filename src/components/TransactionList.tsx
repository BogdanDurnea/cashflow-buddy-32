import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Calendar, Edit2, Receipt, ChevronDown } from "lucide-react";
import { Transaction } from "./TransactionForm";
import { getCategoryConfig } from "@/lib/categoryConfig";
import { EmptyState } from "./EmptyState";
import React from "react";
import { motion } from "framer-motion";
import { ReceiptLink } from "./ReceiptLink";
import { SwipeableTransactionItem } from "./SwipeableTransactionItem";
import { PullToRefresh } from "./PullToRefresh";
import { LoadingTransactionList } from "./LoadingTransactionList";
import { useState } from "react";

const PAGE_SIZE = 20;

interface TransactionListProps {
  transactions: Transaction[];
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onRefresh?: () => Promise<void>;
}

export const TransactionList = React.memo(function TransactionList({ transactions, onEditTransaction, onDeleteTransaction, onRefresh }: TransactionListProps) {
  const { t, i18n } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  
  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const sortedTransactions = transactions.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const visibleTransactions = sortedTransactions.slice(0, visibleCount);
  const hasMore = visibleCount < sortedTransactions.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + PAGE_SIZE, sortedTransactions.length));
  };

  // Reset visible count when transactions change (e.g. filter change)
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [transactions.length]);

  const formatDate = (date: Date) => {
    const dateObj = new Date(date);
    const locale = i18n.language === 'ro' ? 'ro-RO' : i18n.language;
    
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  const formatAmount = (amount: number, currency: string = 'RON', exchangeRate: number = 1) => {
    const ronAmount = amount * exchangeRate;
    const formatted = new Intl.NumberFormat(i18n.language === 'ro' ? 'ro-RO' : i18n.language, {
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">{t("transactions.recentTransactions")}</CardTitle>
            <Badge variant="secondary" className="text-xs font-medium">
              {visibleTransactions.length} / {sortedTransactions.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isRefreshing ? (
            <LoadingTransactionList />
          ) : sortedTransactions.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={Receipt}
                title={t("transactions.noTransactions")}
                description={t("transactions.noTransactionsDesc")}
              />
            </div>
          ) : (
          <PullToRefresh onRefresh={handleRefresh}>
          <ScrollArea className="h-[400px] sm:h-[450px]">
              <div className="space-y-1">
                {visibleTransactions.map((transaction, index) => {
                  const categoryConfig = getCategoryConfig(transaction.category, transaction.type);
                  const CategoryIcon = categoryConfig.icon;
                  
                  return (
                    <SwipeableTransactionItem
                      key={transaction.id}
                      transactionId={transaction.id}
                      onDelete={() => onDeleteTransaction?.(transaction.id)}
                    >
                    <motion.div
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
                              {transaction.type === "income" ? t("transactions.income") : t("transactions.expense")}
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
                            <ReceiptLink attachmentUrl={transaction.attachment_url} />
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
                    </SwipeableTransactionItem>
                  );
                })}

                {/* Load more button */}
                {hasMore && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="p-4 flex flex-col items-center gap-2"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadMore}
                      className="gap-2"
                    >
                      <ChevronDown className="h-4 w-4" />
                      {t("transactions.loadMore", `Încarcă mai multe (${sortedTransactions.length - visibleCount} rămase)`)}
                    </Button>
                  </motion.div>
                )}
              </div>
          </ScrollArea>
          </PullToRefresh>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});
