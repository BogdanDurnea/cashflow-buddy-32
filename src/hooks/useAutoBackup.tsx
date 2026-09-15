import { useEffect, useState, useCallback } from "react";
import type { Transaction } from "@/components/TransactionForm";

const BACKUP_KEY = "autoBackup";
const INTERVAL_DAYS = 7;

export interface BackupSnapshot {
  createdAt: string;
  count: number;
  transactions: Transaction[];
}

export function shouldBackup(lastIso: string | null, now: Date = new Date()): boolean {
  if (!lastIso) return true;
  const last = new Date(lastIso).getTime();
  if (Number.isNaN(last)) return true;
  return now.getTime() - last >= INTERVAL_DAYS * 86_400_000;
}

function readSnapshot(): BackupSnapshot | null {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    return raw ? (JSON.parse(raw) as BackupSnapshot) : null;
  } catch {
    return null;
  }
}

/** Salvează automat o copie locală a tranzacțiilor o dată la 7 zile. */
export function useAutoBackup(transactions: Transaction[]) {
  const [snapshot, setSnapshot] = useState<BackupSnapshot | null>(() => readSnapshot());

  const createBackup = useCallback(() => {
    const next: BackupSnapshot = {
      createdAt: new Date().toISOString(),
      count: transactions.length,
      transactions,
    };
    try {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(next));
      setSnapshot(next);
    } catch {
      // spațiu insuficient — ignorăm, backupul rămâne cel vechi
    }
    return next;
  }, [transactions]);

  useEffect(() => {
    if (!transactions.length) return;
    if (!shouldBackup(snapshot?.createdAt ?? null)) return;
    createBackup();
  }, [transactions, snapshot, createBackup]);

  const downloadBackup = useCallback(() => {
    const data = readSnapshot() ?? createBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cashflow-backup-${data.createdAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [createBackup]);

  return { snapshot, createBackup, downloadBackup };
}
