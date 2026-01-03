import { WifiOff, RefreshCw, CloudOff } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

export const OfflineIndicator = () => {
  const { isOnline, isSyncing, pendingCount, syncPendingTransactions } = useOfflineSync();

  return (
    <AnimatePresence>
      {(!isOnline || pendingCount > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg ${
            isOnline 
              ? 'bg-amber-500/90 text-white' 
              : 'bg-destructive/90 text-destructive-foreground'
          }`}>
            {!isOnline ? (
              <>
                <WifiOff className="h-4 w-4" />
                <span className="text-sm font-medium">Mod Offline</span>
              </>
            ) : pendingCount > 0 ? (
              <>
                <CloudOff className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {pendingCount} modificări nesincronizate
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 hover:bg-white/20"
                  onClick={() => syncPendingTransactions()}
                  disabled={isSyncing}
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                </Button>
              </>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
