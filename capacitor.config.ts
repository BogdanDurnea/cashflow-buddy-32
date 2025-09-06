import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lovable.cashflowbuddy',
  appName: 'cashflow-buddy-32',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    url: 'https://925aba52-baeb-4ad4-82a7-ad7ce8b538ba.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;