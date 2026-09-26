import { useEffect, useState, useCallback } from "react";
import type { Transaction } from "@/components/TransactionForm";

const BACKUP_KEY = "autoBackup";
const INTERVAL_DAYS = 7;

export interface BackupSnapshot {
  createdAt: string;
  count: number;
  transactions: Transaction[];
  range?: { from: string; to: string };
}

export function shouldBackup(lastIso: string | null, now: Date = new Date()): boolean {
  if (!lastIso) return true;
  const last = new Date(lastIso).getTime();
  if (Number.isNaN(last)) return true;
  return now.getTime() - last >= INTERVAL_DAYS * 86_400_000;
}

export function filterByRange(list: Transaction[], from: string, to: string): Transaction[] {
  const start = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity;
  const end = to ? new Date(`${to}T23:59:59.999`).getTime() : Infinity;
  return list.filter((t) => {
    const d = new Date(t.date).getTime();
    return d >= start && d <= end;
  });
}

function readSnapshot(): BackupSnapshot | null {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    return raw ? (JSON.parse(raw) as BackupSnapshot) : null;
  } catch {
    return null;
  }
}

function saveFile(data: BackupSnapshot, suffix = "") {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cashflow-backup-${data.createdAt.slice(0, 10)}${suffix}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Copie locală automată o dată la 7 zile. `fetchLatest` sincronizează
 * tranzacțiile din cloud înainte de o descărcare manuală.
 */
export function useAutoBackup(
  transactions: Transaction[],
  fetchLatest?: () => Promise<Transaction[] | null>
) {
  const [snapshot, setSnapshot] = useState<BackupSnapshot | null>(() => readSnapshot());
  const [syncing, setSyncing] = useState(false);

  const createBackup = useCallback(
    (list: Transaction[] = transactions) => {
      const next: BackupSnapshot = {
        createdAt: new Date().toISOString(),
        count: list.length,
        transactions: list,
      };
      try {
        localStorage.setItem(BACKUP_KEY, JSON.stringify(next));
        setSnapshot(next);
      } catch {
        // spațiu insuficient — păstrăm copia veche
      }
      return next;
    },
    [transactions]
  );

  useEffect(() => {
    if (!transactions.length) return;
    if (!shouldBackup(snapshot?.createdAt ?? null)) return;
    createBackup();
  }, [transactions, snapshot, createBackup]);

  const syncLatest = useCallback(async (): Promise<Transaction[]> => {
    if (!fetchLatest) return transactions;
    setSyncing(true);
    try {
      return (await fetchLatest()) ?? transactions;
    } catch {
      return transactions;
    } finally {
      setSyncing(false);
    }
  }, [fetchLatest, transactions]);

  /** Sincronizează, apoi descarcă toate datele curente. */
  const downloadBackup = useCallback(async () => {
    const latest = await syncLatest();
    saveFile(createBackup(latest));
  }, [syncLatest, createBackup]);

  /** Backup manual pentru orice interval de date. */
  const downloadRange = useCallback(
    async (from: string, to: string) => {
      const latest = await syncLatest();
      const list = filterByRange(latest, from, to);
      const data: BackupSnapshot = {
        createdAt: new Date().toISOString(),
        count: list.length,
        transactions: list,
        range: { from, to },
      };
      saveFile(data, `_${from || "inceput"}_${to || "azi"}`);
      return list.length;
    },
    [syncLatest]
  );

  return { snapshot, syncing, createBackup, downloadBackup, downloadRange };
}
