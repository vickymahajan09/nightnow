import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nightnow.app',
  appName: 'NightNow',
  webDir: 'public',
  server: {
    url: 'https://www.nightnow.in/',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0F0F1E',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP'
    }
  }
};

export default config;