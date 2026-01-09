import { WifiOff, RefreshCw, CloudOff, Cloud, CheckCircle2 } from "lucide-react";
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

  return (
    <>
      {/* Floating indicator when offline or has pending */}
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
                  {pendingCount > 0 && (
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {pendingCount}
                    </Badge>
                  )}
                </>
              ) : pendingCount > 0 ? (
                <>
                  <CloudOff className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {pendingCount} {pendingCount === 1 ? 'modificare' : 'modificări'} nesincronizate
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-3 hover:bg-white/20 gap-1"
                    onClick={handleSync}
                    disabled={isSyncing}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span className="text-xs">Sincronizează</span>
                  </Button>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success animation */}
      <AnimatePresence>
        {lastSyncResult === 'success' && pendingCount === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg bg-green-500/90 text-white">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Totul sincronizat!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync status button in bottom right corner - always visible for quick access */}
      <div className="fixed bottom-4 right-4 z-40">
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button
              variant={pendingCount > 0 ? "default" : "outline"}
              size="sm"
              className={`gap-2 shadow-lg ${
                pendingCount > 0 
                  ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                  : 'bg-background/80 backdrop-blur-sm'
              }`}
            >
              {!isOnline ? (
                <WifiOff className="h-4 w-4" />
              ) : pendingCount > 0 ? (
                <CloudOff className="h-4 w-4" />
              ) : (
                <Cloud className="h-4 w-4 text-green-500" />
              )}
              {pendingCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-white/20">
                  {pendingCount}
                </Badge>
              )}
            </Button>
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
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
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
    </>
  );
};