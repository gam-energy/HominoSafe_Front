'use client';

import { useEffect } from 'react';

/**
 * Synchronously probe for safe-area insets in the DOM.
 */
function probeEnvInset(property: string): number {
  if (typeof document === 'undefined') return 0;
  try {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;visibility:hidden;padding-top:${property};`;
    document.documentElement.appendChild(el);
    const value = Number.parseFloat(getComputedStyle(el).paddingTop) || 0;
    el.remove();
    return value;
  } catch (_) {
    return 0;
  }
}

/**
 * Capacitor: force --app-sat / --app-sab (Android WebView often reports env() as 0).
 * MainActivity also injects the same vars from native status_bar_height.
 */
export function CapacitorSafeArea() {
  useEffect(() => {
    // 1. Synchronously apply fail-safe fallbacks immediately upon mount.
    // This runs before any dynamic imports or Capacitor native plugin calls can fail.
    try {
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
      const isAndroidApp = userAgent.includes('SenioSentry-Android');
      const isNativeCap = (window as any).Capacitor?.isNativePlatform();

      if (isAndroidApp || isNativeCap) {
        document.documentElement.classList.add('native-capacitor');
        // Standard Android status bar is 24dp - 32dp. 40px is a highly safe default.
        document.documentElement.style.setProperty('--app-sat', '40px');
        document.documentElement.style.setProperty('--app-sab', '0px');
      }
    } catch (err) {
      console.error('CapacitorSafeArea synchronous fallback application failed:', err);
    }

    // 2. Perform native Capacitor adjustments asynchronously and safely.
    let cancelled = false;
    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        const isNative = Capacitor.isNativePlatform() || 
                         (typeof window !== 'undefined' && window.navigator.userAgent.includes('SenioSentry-Android'));
        if (!isNative) return;

        if (cancelled) return;
        document.documentElement.classList.add('native-capacitor');

        // Safely adjust the Status Bar over WebView
        try {
          const { StatusBar, Style } = await import('@capacitor/status-bar');
          if (!cancelled) {
            await StatusBar.setOverlaysWebView({ overlay: true });
            await StatusBar.show();
            await StatusBar.setStyle({ style: Style.Dark });
            await StatusBar.setBackgroundColor({ color: '#00000000' });
          }
        } catch (statusError) {
          console.warn('Native StatusBar adjustment skipped or failed:', statusError);
        }

        // Safely probe for precise hardware safe areas
        try {
          if (!cancelled) {
            const envTop = probeEnvInset('env(safe-area-inset-top)');
            const envBottom = probeEnvInset('env(safe-area-inset-bottom)');
            
            // Fallback for Android status bar (40px) and navigation bar (0px)
            const topFallback = Capacitor.getPlatform() === 'android' ? 40 : 0;
            const finalTop = Math.max(envTop, topFallback);
            const finalBottom = Math.max(envBottom, 0);

            document.documentElement.style.setProperty('--app-sat', `${finalTop}px`);
            document.documentElement.style.setProperty('--app-sab', `${finalBottom}px`);
          }
        } catch (measureError) {
          console.warn('Inset measurement failed, keeping fallbacks:', measureError);
        }
      } catch (e) {
        console.error('CapacitorSafeArea async initialization failed:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
