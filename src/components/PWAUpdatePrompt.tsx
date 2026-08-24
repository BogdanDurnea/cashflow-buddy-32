import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PWA_UPDATE_EVENT = "pwa:update-available";

type UpdateEventDetail = {
  waiting?: ServiceWorker | null;
  currentVersion?: string | null;
  newVersion?: string | null;
};

type UpdateEvent = CustomEvent<UpdateEventDetail>;

let dismissSeq = 0;

/** Stable identity for an update (worker instance + version). */
function updateKey(worker: ServiceWorker | null, version: string | null): string {
  if (worker) {
    const w = worker as ServiceWorker & { __pwaKey?: string };
    if (!w.__pwaKey) w.__pwaKey = `w${++dismissSeq}`;
    return `${w.__pwaKey}|${version ?? ""}`;
  }
  return `v|${version ?? ""}`;
}


/**
 * Shows a persistent banner when a new service worker version is waiting.
 * Clicking "Actualizează aplicația" activates the new worker and reloads.
 * The banner displays the current and new version numbers when available.
 */
export function PWAUpdatePrompt() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [visible, setVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [newVersion, setNewVersion] = useState<string | null>(null);
  // Identifies the update the user dismissed via "Mai târziu".
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  useEffect(() => {
    const onUpdate = (event: Event) => {
      const detail = (event as UpdateEvent).detail;
      const next = detail?.waiting ?? null;
      const nextVersion = detail?.newVersion ?? null;
      // Back-to-back updates: always keep only the most recent waiting worker
      // and keep showing a single banner (no duplicates, no stacking).
      setWaiting((current) => (next === current ? current : next));
      setCurrentVersion(detail?.currentVersion ?? null);
      setNewVersion(nextVersion);
      setUpdating(false);

      const key = updateKey(next, nextVersion);
      setDismissedKey((dismissed) => {
        if (dismissed !== null && dismissed === key) {
          // Same update as the one dismissed – stay hidden.
          setVisible(false);
          return dismissed;
        }
        setVisible(true);
        return null;
      });
    };

    window.addEventListener(PWA_UPDATE_EVENT, onUpdate);
    return () => window.removeEventListener(PWA_UPDATE_EVENT, onUpdate);
  }, []);

  const handleUpdate = useCallback(() => {
    setUpdating(true);
    try {
      waiting?.postMessage({ type: "SKIP_WAITING" });
    } catch {
      // ignore – we reload regardless
    }
    window.setTimeout(() => window.location.reload(), 150);
  }, [waiting]);

  const handleDismiss = useCallback(() => {
    setDismissedKey(updateKey(waiting, newVersion));
    setVisible(false);
  }, [waiting, newVersion]);

  if (!visible) return null;


  const hasVersions = Boolean(currentVersion && newVersion);

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="pwa-update-prompt"
      className="fixed bottom-4 left-1/2 z-[100] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-border bg-card p-4 shadow-lg"
    >
      <p className="text-sm font-medium text-card-foreground">
        O versiune nouă este disponibilă
        {newVersion && !currentVersion && ` (${newVersion})`}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {hasVersions
          ? `Versiunea curentă: ${currentVersion} → Versiunea nouă: ${newVersion}`
          : "Reîncarcă pentru a folosi cea mai recentă versiune a aplicației."}
      </p>
      <Button
        className="mt-3 w-full"
        size="sm"
        disabled={updating}
        onClick={handleUpdate}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${updating ? "animate-spin" : ""}`} />
        Actualizează aplicația
      </Button>
    </div>
  );
}
