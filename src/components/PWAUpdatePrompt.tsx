import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PWA_UPDATE_EVENT = "pwa:update-available";

type UpdateEvent = CustomEvent<{ waiting?: ServiceWorker | null }>;

/**
 * Shows a persistent banner when a new service worker version is waiting.
 * Clicking "Actualizează aplicația" activates the new worker and reloads.
 */
export function PWAUpdatePrompt() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [visible, setVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const onUpdate = (event: Event) => {
      const detail = (event as UpdateEvent).detail;
      setWaiting(detail?.waiting ?? null);
      setVisible(true);
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

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="pwa-update-prompt"
      className="fixed bottom-4 left-1/2 z-[100] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-border bg-card p-4 shadow-lg"
    >
      <p className="text-sm font-medium text-card-foreground">
        O versiune nouă este disponibilă
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Reîncarcă pentru a folosi cea mai recentă versiune a aplicației.
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
