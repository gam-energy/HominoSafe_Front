import type { CapacitorConfig } from '@capacitor/cli';

// Capacitor wraps the statically-exported Next.js frontend as an Android app.
// The web bundle lives in `out/` (produced by `npm run build:mobile` with
// Next.js `output: 'export'`). After building, run `npm run cap:sync` to copy
// the web assets into the native project, then `npm run cap:open:android` to
// open Android Studio.
const config: CapacitorConfig = {
  appId: 'com.hominosafe.app',
  appName: 'SenioSentry',
  webDir: 'out',
  bundledWebRuntime: false,
  android: {
    allowMixedContent: true,
    // The backend runs on the host machine during dev; in production this
    // should point at the deployed API.
    captureInput: true,
  },
  server: {
    // Clear the Android WebView cache on each sync so stale JS bundles don't
    // linger between mobile builds.
    cleartext: true,
  },
};

export default config;
