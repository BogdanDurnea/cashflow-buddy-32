import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackPwaEvent } from "@/lib/pwaTelemetry";


export const PWA_UPDATE_EVENT = "pwa:update-available";

type UpdateEventDetail = {
  waiting?: ServiceWorker | null;
  currentVersion?: string | null;
  newVersion?: string | null;
};

type UpdateEvent = CustomEvent<UpdateEventDetail>;

let dismissSeq = 0;

export const DISMISSED_VERSION_KEY = "pwa:update-dismissed-version";

/** Stable identity for an update (worker instance + version). */
function updateKey(worker: ServiceWorker | null, version: string | null): string {
  if (worker) {
    const w = worker as ServiceWorker & { __pwaKey?: string };
    if (!w.__pwaKey) w.__pwaKey = `w${++dismissSeq}`;
    return `${w.__pwaKey}|${version ?? ""}`;
  }
  return `v|${version ?? ""}`;
}

function readDismissedVersion(): string | null {
  try {
    return window.localStorage.getItem(DISMISSED_VERSION_KEY);
  } catch {
    return null;
  }
}

function writeDismissedVersion(version: string | null) {
  try {
    if (version) window.localStorage.setItem(DISMISSED_VERSION_KEY, version);
    else window.localStorage.removeItem(DISMISSED_VERSION_KEY);
  } catch {
    // ignore – storage disabled
  }
}

/**
 * Shows a persistent banner when a new service worker version is waiting.
 * Clicking "Actualizează aplicația" activates the new worker and reloads.
 * "Mai târziu" hides the banner for that version, persisted across refreshes,
 * so it only reappears when a genuinely newer version becomes available.
 */
export function PWAUpdatePrompt() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [visible, setVisible] = useState(false);
  const [resetVisible, setResetVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [newVersion, setNewVersion] = useState<string | null>(null);
  // Identifies the update the user dismissed via "Mai târziu" (this session).
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

      // Persisted dismissal: show the reset control so the user can re-enable
      // the banner, but only on a fresh load — not right after clicking
      // "Mai târziu" in the same session.
      const persisted = readDismissedVersion();
      if (nextVersion && persisted && persisted === nextVersion) {
        setVisible(false);
        setResetVisible(true);
        return;
      }

      const key = updateKey(next, nextVersion);
      setDismissedKey((dismissed) => {
        if (dismissed !== null && dismissed === key) {
          // Same update as the one dismissed – stay hidden.
          setVisible(false);
          setResetVisible(false);
          return dismissed;
        }
        setVisible(true);
        setResetVisible(false);
        return null;
      });
    };

    window.addEventListener(PWA_UPDATE_EVENT, onUpdate);
    return () => window.removeEventListener(PWA_UPDATE_EVENT, onUpdate);
  }, []);

  const handleUpdate = useCallback(() => {
    setUpdating(true);
    trackPwaEvent("pwa:skip-waiting", { currentVersion, newVersion });
    // A version the user actually installed must not stay dismissed.
    writeDismissedVersion(null);
    try {
      waiting?.postMessage({ type: "SKIP_WAITING" });
    } catch {
      // ignore – we reload regardless
    }
    window.setTimeout(() => window.location.reload(), 150);
  }, [waiting, currentVersion, newVersion]);

  const handleDismiss = useCallback(() => {
    trackPwaEvent("pwa:update-dismissed", { currentVersion, newVersion });
    setDismissedKey(updateKey(waiting, newVersion));
    writeDismissedVersion(newVersion);
    setVisible(false);
    setResetVisible(false);
  }, [waiting, currentVersion, newVersion]);

  const handleReset = useCallback(() => {
    trackPwaEvent("pwa:update-reset", { currentVersion, newVersion });
    writeDismissedVersion(null);
    setDismissedKey(null);
    if (waiting) {
      setVisible(true);
      setResetVisible(false);
    }
  }, [waiting, currentVersion, newVersion]);

  const handleResetDismiss = useCallback(() => {
    setResetVisible(false);
  }, []);

  if (!visible && !resetVisible) return null;

  if (resetVisible && waiting && newVersion) {
    return (
      <div
        role="status"
        aria-live="polite"
        data-testid="pwa-update-reset"
        className="fixed bottom-4 left-1/2 z-[100] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-border bg-card p-4 shadow-lg"
      >
        <p className="text-sm font-medium text-card-foreground">
          O versiune nouă ({newVersion}) este ascunsă
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Ai ales „Mai târziu" pentru această versiune. Poți reafișa bannerul oricând.
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            variant="ghost"
            className="flex-1"
            size="sm"
            data-testid="pwa-update-reset-dismiss"
            onClick={handleResetDismiss}
          >
            Închide
          </Button>
          <Button
            className="flex-1"
            size="sm"
            data-testid="pwa-update-reset-button"
            onClick={handleReset}
          >
            Resetează opțiunea
          </Button>
        </div>
      </div>
    );
  }

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
      <div className="mt-3 flex gap-2">
        <Button
          variant="ghost"
          className="flex-1"
          size="sm"
          data-testid="pwa-update-dismiss"
          onClick={handleDismiss}
        >
          Mai târziu
        </Button>
        <Button
          className="flex-1"
          size="sm"
          disabled={updating}
          onClick={handleUpdate}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${updating ? "animate-spin" : ""}`} />
          Actualizează aplicația
        </Button>
      </div>
    </div>
  );
}
