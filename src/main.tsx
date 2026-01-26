import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { registerServiceWorker } from './lib/serviceWorkerRegistration'

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for push notifications
if (import.meta.env.PROD) {
  registerServiceWorker();
}
