import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.5602c7077a0d427babdda5f836d7fee9',
  appName: 'smartcardsa',
  webDir: 'dist',
  server: {
    url: 'https://5602c707-7a0d-427b-abdd-a5f836d7fee9.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
