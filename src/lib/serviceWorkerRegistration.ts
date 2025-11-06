export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker nu este suportat de acest browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    
    console.log('Service Worker înregistrat cu succes:', registration);
    
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
