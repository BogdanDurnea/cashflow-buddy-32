/**
 * Lightweight, dependency-free telemetry for PWA update events.
 *
 * Events are logged to the console and kept in localStorage (capped ring
 * buffer) together with aggregate counters, so update rates can be inspected
 * in production via `getPwaTelemetrySummary()`.
 */

export type PwaTelemetryEvent =
  | 'pwa:update-available'
  | 'pwa:update-dismissed'
  | 'pwa:skip-waiting';

export type PwaTelemetryRecord = {
  event: PwaTelemetryEvent;
  at: string;
  currentVersion?: string | null;
  newVersion?: string | null;
};

const STORAGE_KEY = 'pwa:telemetry';
const MAX_RECORDS = 50;

type TelemetryState = {
  counts: Partial<Record<PwaTelemetryEvent, number>>;
  records: PwaTelemetryRecord[];
};

function readState(): TelemetryState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { counts: {}, records: [] };
    const parsed = JSON.parse(raw) as TelemetryState;
    return {
      counts: parsed?.counts ?? {},
      records: Array.isArray(parsed?.records) ? parsed.records : [],
    };
  } catch {
    return { counts: {}, records: [] };
  }
}

function writeState(state: TelemetryState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full / disabled – telemetry must never break the app
  }
}

/** Records a PWA lifecycle event (console + localStorage + custom event). */
export function trackPwaEvent(
  event: PwaTelemetryEvent,
  detail: { currentVersion?: string | null; newVersion?: string | null } = {}
): PwaTelemetryRecord {
  const record: PwaTelemetryRecord = {
    event,
    at: new Date().toISOString(),
    currentVersion: detail.currentVersion ?? null,
    newVersion: detail.newVersion ?? null,
  };

  console.info('[pwa-telemetry]', record);

  if (typeof window !== 'undefined') {
    const state = readState();
    state.counts[event] = (state.counts[event] ?? 0) + 1;
    state.records = [...state.records, record].slice(-MAX_RECORDS);
    writeState(state);

    try {
      window.dispatchEvent(
        new CustomEvent<PwaTelemetryRecord>('pwa:telemetry', { detail: record })
      );
    } catch {
      // ignore
    }
  }

  return record;
}

/** Aggregate view: counts, update rate and the recent event log. */
export function getPwaTelemetrySummary() {
  const state = readState();
  const offered = state.counts['pwa:update-available'] ?? 0;
  const applied = state.counts['pwa:skip-waiting'] ?? 0;
  const dismissed = state.counts['pwa:update-dismissed'] ?? 0;

  return {
    offered,
    applied,
    dismissed,
    updateRate: offered > 0 ? applied / offered : 0,
    records: state.records,
  };
}

/** Clears stored telemetry (tests / user-triggered reset). */
export function clearPwaTelemetry() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
