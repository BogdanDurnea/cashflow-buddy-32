import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reîncarcă datele când se modifică tranzacțiile utilizatorului pe alt dispozitiv
 * sau când un membru al unui buget partajat face o modificare.
 */
export function useRealtimeTransactions(userId: string | undefined, onChange: () => void) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`realtime-transactions-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` },
        () => onChange()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onChange]);
}

/** Actualizare instant a bugetelor partajate din care face parte utilizatorul. */
export function useRealtimeSharedBudgets(userId: string | undefined, onChange: () => void) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`realtime-shared-budgets-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "shared_budgets" }, () => onChange())
      .on("postgres_changes", { event: "*", schema: "public", table: "shared_budget_members" }, () => onChange())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onChange]);
}
