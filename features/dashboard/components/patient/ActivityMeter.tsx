'use client';

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const ACTIVITY_INTENSITY: Record<string, number> = {
  Running: 92,
  Walking: 80,
  Standing: 65,
  Sitting: 45,
  Sleeping: 25,
};

const ACTIVITY_I18N: Record<string, string> = {
  running: 'activity_running',
  walking: 'activity_walking',
  standing: 'activity_standing',
  sitting: 'activity_sitting',
  sleeping: 'activity_sleeping',
};

export function activityIntensity(activity?: string | null, fallback = 0): number {
  if (!activity) return fallback;
  const key = Object.keys(ACTIVITY_INTENSITY).find(
    (k) => k.toLowerCase() === activity.toLowerCase()
  );
  return key ? ACTIVITY_INTENSITY[key] : fallback;
}

function translateActivityLabel(
  activity: string | null | undefined,
  t: (key: string, fallback?: string) => string
): string {
  if (!activity) return '—';
  const key = ACTIVITY_I18N[activity.toLowerCase()];
  return key ? t(key, activity) : activity;
}

/** Compact horizontal meter for watch body activity (0–100). */
export function ActivityMeter({
  activity,
  intensity,
  bodyPosition,
  className,
  compact = false,
}: {
  activity?: string | null;
  intensity?: number | null;
  bodyPosition?: string | null;
  className?: string;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const value = Math.max(
    0,
    Math.min(100, intensity ?? activityIntensity(activity, 0))
  );
  const label = translateActivityLabel(activity, t);

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium truncate text-start">{label}</span>
        <span className="ltr-nums text-muted-foreground shrink-0" dir="ltr">
          {value}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-zinc-200/80 dark:bg-zinc-800 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            value >= 85
              ? 'bg-rose-500'
              : value >= 70
                ? 'bg-amber-500'
                : value >= 50
                  ? 'bg-emerald-500'
                  : value >= 30
                    ? 'bg-sky-500'
                    : 'bg-zinc-400'
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      {!compact && bodyPosition && (
        <p className="text-[11px] text-muted-foreground text-start">
          {translateActivityLabel(bodyPosition, t)}
        </p>
      )}
    </div>
  );
}
