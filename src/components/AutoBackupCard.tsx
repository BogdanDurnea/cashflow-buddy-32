import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Download, RefreshCw, Upload, CalendarRange } from "lucide-react";
import type { Transaction } from "@/components/TransactionForm";
import { useAutoBackup, type BackupSnapshot } from "@/hooks/useAutoBackup";
import { parseBankStatement, toTransactions } from "@/lib/bankImport";
import { useToast } from "@/hooks/use-toast";

interface Props {
  transactions: Transaction[];
  fetchLatest?: () => Promise<Transaction[] | null>;
  onImport?: (list: Transaction[]) => void;
}

export function AutoBackupCard({ transactions, fetchLatest, onImport }: Props) {
  const { toast } = useToast();
  const { snapshot, syncing, createBackup, downloadBackup, downloadRange } = useAutoBackup(
    transactions,
    fetchLatest
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const fileRef = useRef<HTMLInputElement>(null);

  const lastLabel = snapshot
    ? new Date(snapshot.createdAt).toLocaleString("ro-RO", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "încă nu s-a făcut";

  const handleRange = async () => {
    const n = await downloadRange(from, to);
    toast({ title: "Backup descărcat", description: `${n} tranzacții în intervalul ales.` });
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onImport) return;
    try {
      const text = await file.text();
      let list: Transaction[];
      if (file.name.toLowerCase().endsWith(".json")) {
        const data = JSON.parse(text) as BackupSnapshot;
        if (!Array.isArray(data.transactions)) throw new Error("Fișier de backup invalid");
        list = data.transactions.map((t, i) => ({
          ...t,
          id: `restore-${Date.now()}-${i}`,
          date: new Date(t.date),
        }));
      } else {
        list = toTransactions(parseBankStatement(text).rows);
      }
      if (!list.length) throw new Error("Nu s-au găsit tranzacții");
      onImport(list);
      toast({ title: "Import reușit", description: `${list.length} tranzacții importate.` });
    } catch (err) {
      toast({
        title: "Eroare la import",
        description: err instanceof Error ? err.message : "Fișier invalid",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-card">
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-success/15 shrink-0">
              <ShieldCheck className="h-5 w-5 text-success" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-sm">Copie de siguranță</p>
              <p className="text-xs text-muted-foreground mt-1">
                Automat o dată pe săptămână. Ultima copie: {lastLabel}
                {snapshot ? ` (${snapshot.count} tranzacții)` : ""}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => createBackup()}>
              Salvează acum
            </Button>
            <Button size="sm" onClick={downloadBackup} disabled={syncing}>
              {syncing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {syncing ? "Se sincronizează..." : "Descarcă"}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end border-t border-border pt-4">
          <div className="space-y-1">
            <Label htmlFor="backup-from" className="text-xs">De la</Label>
            <Input id="backup-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="backup-to" className="text-xs">Până la</Label>
            <Input id="backup-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button size="sm" variant="outline" onClick={handleRange} disabled={syncing}>
            <CalendarRange className="h-4 w-4 mr-2" />
            Backup pe interval
          </Button>
        </div>

        {onImport && (
          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Restaurează dintr-un backup (.json) sau importă un extras CSV.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={handleFile}
              aria-label="Alege fișier de import"
            />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Importă fișier
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
