'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const APK_URL = '/downloads/SenioSentry.apk';

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function isMobileUa(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/**
 * Helps users leave the browser tab: native install prompt, manual Add-to-Home,
 * or download the Android APK
 */
export function InstallPwaPrompt() {
  const { t } = useTranslation();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [androidHint, setAndroidHint] = useState(false);
  const [apkAvailable, setApkAvailable] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay()) return;
    if (localStorage.getItem('pwa-install-dismissed') === '1') return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBip);

    const ua = navigator.userAgent;
    const isIos =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);

    if (isIos) {
      setIosHint(true);
      setVisible(true);
    } else if (isAndroid || isMobileUa()) {
      setAndroidHint(true);
      setVisible(true);
    }

    fetch(APK_URL, { method: 'HEAD' })
      .then((r) => setApkAvailable(r.ok))
      .catch(() => setApkAvailable(false));

    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem('pwa-install-dismissed', '1');
    setVisible(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === 'accepted') setVisible(false);
  }, [deferred]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-md rounded-2xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur-md sm:inset-x-auto sm:start-4 sm:bottom-4">
      <div className="flex items-start gap-3">
        <img
          src="/icons/icon-192.png"
          alt=""
          width={48}
          height={48}
          className="mt-0.5 h-12 w-12 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-bold text-foreground">
            {t('install_app_title', 'Install SenioSentry')}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {iosHint && !deferred
              ? t(
                  'install_app_ios_hint',
                  'Tap Share, then “Add to Home Screen” to open SenioSentry as its own app.',
                )
              : androidHint && !deferred
                ? t(
                    'install_app_android_hint',
                    'In Brave/Chrome: menu ⋮ → Install app (or Add to Home screen). Or download the Android app file below.',
                  )
                : t(
                    'install_app_desc',
                    'Install the app to open SenioSentry full-screen — not inside the browser.',
                  )}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {deferred ? (
              <Button size="sm" className="rounded-xl h-8" onClick={install}>
                <Download className="me-1.5 h-3.5 w-3.5" />
                {t('install_app_cta', 'Install app')}
              </Button>
            ) : null}
            {apkAvailable ? (
              <Button size="sm" variant="secondary" className="rounded-xl h-8" asChild>
                <a href={APK_URL} download="SenioSentry.apk">
                  <Smartphone className="me-1.5 h-3.5 w-3.5" />
                  {t('download_apk', 'Download APK')}
                </a>
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" className="rounded-xl h-8" onClick={dismiss}>
              {t('dismiss', 'Not now')}
            </Button>
          </div>
        </div>
        <button
          type="button"
          aria-label={t('close', 'Close')}
          className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
