import { WifiOff, RefreshCw, CloudOff, Cloud, CheckCircle2, Loader2 } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const OfflineIndicator = () => {
  const { isOnline, isSyncing, pendingCount, syncPendingTransactions } = useOfflineSync();
  const [showDialog, setShowDialog] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<'success' | 'error' | null>(null);

  const handleSync = async () => {
    try {
      await syncPendingTransactions();
      setLastSyncResult('success');
      setTimeout(() => setLastSyncResult(null), 3000);
    } catch {
      setLastSyncResult('error');
    }
  };

  // Determine status
  const hasIssues = !isOnline || pendingCount > 0;
  const statusColor = !isOnline 
    ? "bg-destructive" 
    : pendingCount > 0 
      ? "bg-amber-500" 
      : "bg-green-500";

  return (
    <>
      {/* Fixed sync indicator in top-right corner */}
      <div className="fixed top-4 right-4 z-50">
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative flex items-center gap-2 px-3 py-2 rounded-full
                shadow-lg backdrop-blur-md border border-border/50
                transition-all duration-300 cursor-pointer
                ${hasIssues 
                  ? 'bg-background/95 hover:bg-background' 
                  : 'bg-background/80 hover:bg-background/95'
                }
              `}
            >
              {/* Animated status dot */}
              <span className="relative flex h-3 w-3">
                <motion.span
                  animate={hasIssues ? { scale: [1, 1.2, 1], opacity: [1, 0.5, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`absolute inset-0 rounded-full ${statusColor} ${hasIssues ? 'opacity-75' : ''}`}
                />
                <span className={`relative rounded-full h-3 w-3 ${statusColor}`} />
              </span>

              {/* Status text */}
              <AnimatePresence mode="wait">
                {!isOnline ? (
                  <motion.div
                    key="offline"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    className="flex items-center gap-1.5"
                  >
                    <WifiOff className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-foreground">Offline</span>
                  </motion.div>
                ) : pendingCount > 0 ? (
                  <motion.div
                    key="pending"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    className="flex items-center gap-1.5"
                  >
                    {isSyncing ? (
                      <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                    ) : (
                      <CloudOff className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      {isSyncing ? 'Sincronizare...' : `${pendingCount} în așteptare`}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="synced"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    className="flex items-center gap-1.5"
                  >
                    <Cloud className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-foreground">Sincronizat</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pending badge */}
              {pendingCount > 0 && !isSyncing && (
                <Badge 
                  variant="secondary" 
                  className="h-5 min-w-5 px-1.5 text-xs bg-amber-500 text-white border-0"
                >
                  {pendingCount}
                </Badge>
              )}
            </motion.button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {!isOnline ? (
                  <>
                    <WifiOff className="h-5 w-5 text-destructive" />
                    Mod Offline
                  </>
                ) : pendingCount > 0 ? (
                  <>
                    <CloudOff className="h-5 w-5 text-amber-500" />
                    Sincronizare necesară
                  </>
                ) : (
                  <>
                    <Cloud className="h-5 w-5 text-green-500" />
                    Sincronizat
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {!isOnline 
                  ? "Nu ai conexiune la internet. Modificările vor fi salvate local și sincronizate când revii online."
                  : pendingCount > 0 
                    ? `Ai ${pendingCount} ${pendingCount === 1 ? 'modificare' : 'modificări'} care așteaptă sincronizarea cu serverul.`
                    : "Toate datele sunt sincronizate cu serverul."
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Status indicator */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm">Conexiune</span>
                </div>
                <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
              </div>

              {/* Pending count */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <CloudOff className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Modificări în așteptare</span>
                </div>
                <Badge variant={pendingCount > 0 ? "default" : "secondary"}>
                  {pendingCount}
                </Badge>
              </div>

              {/* Sync button */}
              {isOnline && pendingCount > 0 && (
                <Button 
                  className="w-full gap-2" 
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Se sincronizează...' : 'Sincronizează acum'}
                </Button>
              )}

              {/* Already synced message */}
              {pendingCount === 0 && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Toate datele sunt la zi!</span>
                </div>
              )}

              {/* Info about offline mode */}
              {!isOnline && (
                <div className="text-xs text-muted-foreground p-3 rounded-lg bg-muted">
                  <p className="font-medium mb-1">Cum funcționează modul offline:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Poți adăuga, edita și șterge tranzacții</li>
                    <li>Modificările sunt salvate pe dispozitiv</li>
                    <li>Când revii online, datele se sincronizează automat</li>
                  </ul>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Success notification */}
      <AnimatePresence>
        {lastSyncResult === 'success' && pendingCount === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg bg-green-500 text-white">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Totul sincronizat!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};