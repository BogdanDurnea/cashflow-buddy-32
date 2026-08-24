import { trackPwaEvent } from './pwaTelemetry';

export const PWA_UPDATE_EVENT = 'pwa:update-available';

export const SW_VERSION_PARAM = 'v';

/** Last worker we already announced – prevents duplicate events for the same update. */
let lastNotifiedWorker: ServiceWorker | null = null;

function getVersionFromScriptURL(scriptURL: string | undefined): string | null {
  if (!scriptURL) return null;
  try {
    const url = new URL(scriptURL, window.location.href);
    return url.searchParams.get(SW_VERSION_PARAM);
  } catch {
    return null;
  }
}

type UpdateEventDetail = {
  waiting?: ServiceWorker | null;
  currentVersion?: string | null;
  newVersion?: string | null;
};

type UpdateEvent = CustomEvent<UpdateEventDetail>;

function notifyUpdateAvailable(registration: ServiceWorkerRegistration) {
  // Two updates in a row must announce only the newest worker, once each.
  const waiting = registration.waiting;
  if (waiting && waiting === lastNotifiedWorker) return;
  lastNotifiedWorker = waiting ?? null;

  const currentVersion = getVersionFromScriptURL(registration.active?.scriptURL);
  const newVersion = getVersionFromScriptURL(waiting?.scriptURL) ?? currentVersion;

  window.dispatchEvent(
    new CustomEvent<UpdateEventDetail>(PWA_UPDATE_EVENT, {
      detail: { waiting, currentVersion, newVersion },
    })
  );
}

/** Test/reset helper – forgets the last announced worker. */
export function resetUpdateNotifications() {
  lastNotifiedWorker = null;
}

/** Watches a registration and announces any waiting (updated) service worker. */
export function watchForUpdates(registration: ServiceWorkerRegistration) {
  if (registration.waiting && navigator.serviceWorker.controller) {
    notifyUpdateAvailable(registration);
  }

  registration.addEventListener('updatefound', () => {
    const installing = registration.installing;
    if (!installing) return;

    installing.addEventListener('statechange', () => {
      if (installing.state === 'installed' && navigator.serviceWorker.controller) {
        notifyUpdateAvailable(registration);
      }
    });
  });
}


export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker nu este suportat de acest browser');
    return null;
  }

  try {
    const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown';
    const registration = await navigator.serviceWorker.register(`/sw.js?${SW_VERSION_PARAM}=${encodeURIComponent(version)}`, {
      scope: '/'
    });
    
    console.log('Service Worker înregistrat cu succes:', registration);

    watchForUpdates(registration);
    
    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('Service Worker este activ');
    
    return registration;
  } catch (error) {
    console.error('Eroare la înregistrarea Service Worker:', error);
    return null;
  }
}

export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log('Service Worker dezînregistrat cu succes');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Eroare la dezînregistrarea Service Worker:', error);
    return false;
  }
}
