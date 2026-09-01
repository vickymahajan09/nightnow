import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nightnow.app',
  appName: 'NightNow',
  webDir: 'public',
  server: {
    url: 'https://www.nightnow.in/',
    cleartext: false
  }
};

export default config;