import type { CapacitorConfig } from '@capacitor/cli';

// Thin Android shell (Azki/Milli style): WebView loads the live HTTPS site.
// Build APK with: npm run mobile:apk
const LIVE_URL =
  process.env.CAPACITOR_SERVER_URL || 'https://93.118.120.215:3000';

const config: CapacitorConfig = {
  appId: 'com.seniosentry.app',
  appName: 'SenioSentry',
  webDir: 'out',
  android: {
    allowMixedContent: true,
    captureInput: true,
  },
  server: {
    // Load production UI over HTTPS instead of bundled static files.
    url: LIVE_URL,
    cleartext: true,
    androidScheme: 'https',
  },
};

export default config;
