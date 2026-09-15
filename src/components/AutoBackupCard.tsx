import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Download } from "lucide-react";
import type { Transaction } from "@/components/TransactionForm";
import { useAutoBackup } from "@/hooks/useAutoBackup";

export function AutoBackupCard({ transactions }: { transactions: Transaction[] }) {
  const { snapshot, createBackup, downloadBackup } = useAutoBackup(transactions);

  const lastLabel = snapshot
    ? new Date(snapshot.createdAt).toLocaleDateString("ro-RO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "încă nu s-a făcut";

  return (
    <Card className="shadow-card">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 rounded-lg bg-success/15 shrink-0">
            <ShieldCheck className="h-5 w-5 text-success" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-sm">Copie de siguranță automată</p>
            <p className="text-xs text-muted-foreground mt-1">
              Se salvează automat pe dispozitiv o dată pe săptămână. Ultima copie: {lastLabel}
              {snapshot ? ` (${snapshot.count} tranzacții)` : ""}.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={() => createBackup()}>
            Salvează acum
          </Button>
          <Button size="sm" onClick={downloadBackup}>
            <Download className="h-4 w-4 mr-2" />
            Descarcă
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
