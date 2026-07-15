'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'senio.dashboardPrefs';

export type DashboardPrefs = {
  /** Show vitals + environment KPIs together (no tab filter). */
  showAllCharts: boolean;
  /** Stack every history metric as its own chart (no metric dropdown). */
  showAllHistoryCharts: boolean;
  /** Tighter KPI cards and chart heights (especially useful on mobile). */
  compactCharts: boolean;
};

export const DEFAULT_DASHBOARD_PREFS: DashboardPrefs = {
  showAllCharts: false,
  showAllHistoryCharts: false,
  compactCharts: true,
};

function readPrefs(): DashboardPrefs {
  if (typeof window === 'undefined') return DEFAULT_DASHBOARD_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DASHBOARD_PREFS;
    return { ...DEFAULT_DASHBOARD_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DASHBOARD_PREFS;
  }
}

function writePrefs(prefs: DashboardPrefs) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event('senio-dashboard-prefs'));
}

/** Dashboard report/chart preferences (localStorage + cross-tab sync). */
export function useDashboardPrefs() {
  const [prefs, setPrefsState] = useState<DashboardPrefs>(DEFAULT_DASHBOARD_PREFS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPrefsState(readPrefs());
    setReady(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) setPrefsState(readPrefs());
    };
    const onCustom = () => setPrefsState(readPrefs());
    window.addEventListener('storage', onStorage);
    window.addEventListener('senio-dashboard-prefs', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('senio-dashboard-prefs', onCustom);
    };
  }, []);

  const setPrefs = useCallback((patch: Partial<DashboardPrefs>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...patch };
      writePrefs(next);
      return next;
    });
  }, []);

  const setPref = useCallback(
    <K extends keyof DashboardPrefs>(key: K, value: DashboardPrefs[K]) => {
      setPrefs({ [key]: value });
    },
    [setPrefs]
  );

  return { prefs, setPrefs, setPref, ready };
}
