import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PendingTransaction {
  id: string;
  type: 'insert' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
}

const PENDING_TRANSACTIONS_KEY = 'moneytracker_pending_transactions';
const CACHED_DATA_KEY = 'moneytracker_cached_data';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Conexiune restabilită", {
        description: "Sincronizarea datelor în curs..."
      });
      syncPendingTransactions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Mod offline", {
        description: "Modificările vor fi sincronizate când reveniți online."
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending transactions on mount
    const pending = getPendingTransactions();
    setPendingCount(pending.length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getPendingTransactions = (): PendingTransaction[] => {
    try {
      const stored = localStorage.getItem(PENDING_TRANSACTIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const savePendingTransaction = (transaction: PendingTransaction) => {
    const pending = getPendingTransactions();
    pending.push(transaction);
    localStorage.setItem(PENDING_TRANSACTIONS_KEY, JSON.stringify(pending));
    setPendingCount(pending.length);
  };

  const clearPendingTransactions = () => {
    localStorage.removeItem(PENDING_TRANSACTIONS_KEY);
    setPendingCount(0);
  };

  const syncPendingTransactions = async () => {
    if (!navigator.onLine || isSyncing) return;

    const pending = getPendingTransactions();
    if (pending.length === 0) return;

    setIsSyncing(true);
    let successCount = 0;
    let failedTransactions: PendingTransaction[] = [];

    for (const transaction of pending) {
      try {
        if (transaction.type === 'insert') {
          const { error } = await supabase
            .from(transaction.table as any)
            .insert(transaction.data);
          if (error) throw error;
        } else if (transaction.type === 'update') {
          const { id, ...updateData } = transaction.data;
          const { error } = await supabase
            .from(transaction.table as any)
            .update(updateData)
            .eq('id', id);
          if (error) throw error;
        } else if (transaction.type === 'delete') {
          const { error } = await supabase
            .from(transaction.table as any)
            .delete()
            .eq('id', transaction.data.id);
          if (error) throw error;
        }
        successCount++;
      } catch (error) {
        console.error('Sync error:', error);
        failedTransactions.push(transaction);
      }
    }

    if (failedTransactions.length > 0) {
      localStorage.setItem(PENDING_TRANSACTIONS_KEY, JSON.stringify(failedTransactions));
      setPendingCount(failedTransactions.length);
    } else {
      clearPendingTransactions();
    }

    setIsSyncing(false);

    if (successCount > 0) {
      toast.success(`${successCount} tranzacții sincronizate`, {
        description: failedTransactions.length > 0 
          ? `${failedTransactions.length} tranzacții nu au putut fi sincronizate`
          : undefined
      });
    }
  };

  // Cache data for offline use
  const cacheData = useCallback((key: string, data: any) => {
    try {
      const cached = getCachedData();
      cached[key] = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHED_DATA_KEY, JSON.stringify(cached));
    } catch (error) {
      console.error('Cache error:', error);
    }
  }, []);

  const getCachedData = (): Record<string, { data: any; timestamp: number }> => {
    try {
      const stored = localStorage.getItem(CACHED_DATA_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const getFromCache = useCallback((key: string, maxAge?: number): any | null => {
    const cached = getCachedData();
    const item = cached[key];
    
    if (!item) return null;
    
    if (maxAge && Date.now() - item.timestamp > maxAge) {
      return null;
    }
    
    return item.data;
  }, []);

  // Offline-aware data operations
  const offlineInsert = useCallback(async (
    table: string, 
    data: any,
    options?: { optimistic?: boolean }
  ) => {
    if (navigator.onLine) {
      const { error, data: result } = await supabase
        .from(table as any)
        .insert(data)
        .select();
      
      if (error) throw error;
      return result;
    } else {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const pendingData = { ...data, id: tempId };
      
      savePendingTransaction({
        id: tempId,
        type: 'insert',
        table,
        data,
        timestamp: Date.now()
      });

      if (options?.optimistic) {
        return [pendingData];
      }
      
      return null;
    }
  }, []);

  const offlineUpdate = useCallback(async (
    table: string, 
    id: string, 
    data: any
  ) => {
    if (navigator.onLine) {
      const { error, data: result } = await supabase
        .from(table as any)
        .update(data)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return result;
    } else {
      savePendingTransaction({
        id: `update_${id}_${Date.now()}`,
        type: 'update',
        table,
        data: { id, ...data },
        timestamp: Date.now()
      });
      
      return null;
    }
  }, []);

  const offlineDelete = useCallback(async (table: string, id: string) => {
    if (navigator.onLine) {
      const { error } = await supabase
        .from(table as any)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } else {
      savePendingTransaction({
        id: `delete_${id}_${Date.now()}`,
        type: 'delete',
        table,
        data: { id },
        timestamp: Date.now()
      });
      
      return true;
    }
  }, []);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncPendingTransactions,
    cacheData,
    getFromCache,
    offlineInsert,
    offlineUpdate,
    offlineDelete
  };
};
