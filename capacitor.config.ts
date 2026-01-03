import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.moneytracker',
  appName: 'MoneyTracker',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;