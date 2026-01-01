import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.925aba52baeb4ad482a7ad7ce8b538ba',
  appName: 'MoneyTracker',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: 'https://925aba52-baeb-4ad4-82a7-ad7ce8b538ba.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;