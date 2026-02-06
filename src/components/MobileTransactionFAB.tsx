import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { TransactionForm, Transaction } from "@/components/TransactionForm";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface MobileTransactionFABProps {
  onAddTransaction: (transaction: Omit<Transaction, "id">) => void;
}

export function MobileTransactionFAB({ onAddTransaction }: MobileTransactionFABProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  if (!isMobile) return null;

  const handleAdd = (transaction: Omit<Transaction, "id">) => {
    onAddTransaction(transaction);
    setOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              size="lg"
              onClick={() => setOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-95 transition-all"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="pb-0">
            <DrawerTitle>{t("transactions.addTransaction")}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">
            <TransactionForm onAddTransaction={handleAdd} />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
