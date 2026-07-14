'use client';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCnnPredictions } from '@/features/predictions/api/useCnnPredictions';
import {
  Activity,
  Gauge,
  HeartPulse,
  Loader2,
  ShieldAlert,
  Watch,
  Waves,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const CHART = {
  sbp: '#8b5cf6',
  dbp: '#10b981',
  cardiac: '#f43f5e',
  grid: 'var(--border)',
  tick: 'var(--muted-foreground)',
};

function fmt1(value?: number | null, suffix = '') {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toFixed(1)}${suffix}`;
}

function fmt2(value?: number | null, suffix = '') {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toFixed(2)}${suffix}`;
}

function levelTone(level?: string | null) {
  const l = (level || '').toLowerCase();
  if (l.includes('critical') || l === 'high') {
    return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300';
  }
  if (l.includes('moderate') || l === 'medium') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
  }
  return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
}

function CnnChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-lg">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry) => {
        const unit = entry.dataKey === 'cardiac' ? '' : ' mmHg';
        return (
          <p
            key={entry.dataKey ?? entry.name}
            className="ltr-nums text-sm font-semibold text-foreground"
          >
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}:{' '}
            {typeof entry.value === 'number' ? entry.value.toFixed(1) : '—'}
            {unit}
          </p>
        );
      })}
    </div>
  );
}

export function CnnResultsCard({
  userId,
  compact = false,
}: {
  userId: number;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = useCnnPredictions(userId);
  const window = data?.latest_window;

  const chartData = useMemo(() => {
    const rows = [...(data?.recent_windows ?? [])].reverse();
    return rows.map((w) => ({
      time: new Date(w.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      sbp: w.sbp_mmhg ?? null,
      dbp: w.dbp_mmhg ?? null,
      cardiac: w.cardiac_risk_score ?? null,
    }));
  }, [data?.recent_windows]);

  return (
    <Card className="min-w-0 overflow-hidden border-border/80">
      <CardHeader className="space-y-3 px-4 sm:px-6">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 shrink-0" />
              <span className="break-words">
                {t('cnn_vitals_predictions', 'CNN vitals predictions')}
              </span>
            </CardTitle>
            <CardDescription className="mt-1 max-w-full break-words">
              {data?.description ??
                t(
                  'cnn_results_desc',
                  'Edge BiLSTM-CNN estimates from the connected watch stream.'
                )}
            </CardDescription>
          </div>
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold',
              data?.watch_connected
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <Watch className="h-3.5 w-3.5" />
            {data?.watch_connected
              ? t('watch_connected', 'Watch connected')
              : t('watch_offline', 'Watch offline')}
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4 px-4 pb-6 sm:px-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('loading', 'Loading...')}
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive">
            {error?.message || t('failed_load_cnn', 'Failed to load CNN predictions.')}
          </p>
        ) : !window ? (
          <p className="text-sm text-muted-foreground">
            {t(
              'no_cnn_windows',
              'No CNN prediction windows yet. Waiting for watch PPG/ECG samples.'
            )}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {t('model_version', 'Model version')}:{' '}
                <span className="font-medium text-foreground">
                  {data?.model_version ?? 'cnn-cardiac-v1'}
                </span>
              </p>
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold uppercase',
                  levelTone(window.cardiac_level)
                )}
              >
                {window.cardiac_level || 'n/a'}{' '}
                {t('cardiac_risk', 'cardiac risk')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-2xl border border-border/80 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Gauge className="h-3.5 w-3.5" />
                  {t('blood_pressure', 'Blood pressure')}
                </div>
                <p className="ltr-nums text-xl font-semibold">
                  {window.sbp_mmhg != null && window.dbp_mmhg != null
                    ? `${Math.round(window.sbp_mmhg)}/${Math.round(window.dbp_mmhg)}`
                    : '—'}
                </p>
              </div>
              <div className="rounded-2xl border border-border/80 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <HeartPulse className="h-3.5 w-3.5" />
                  {t('af_probability', 'AF probability')}
                </div>
                <p className="ltr-nums text-xl font-semibold">
                  {fmt2(
                    window.af_probability != null
                      ? window.af_probability * 100
                      : null,
                    '%'
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-border/80 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Waves className="h-3.5 w-3.5" />
                  RMSSD
                </div>
                <p className="ltr-nums text-xl font-semibold">
                  {fmt1(window.rmssd_ms, ' ms')}
                </p>
              </div>
              <div className="rounded-2xl border border-border/80 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  {t('cardiac_score', 'Cardiac score')}
                </div>
                <p className="ltr-nums text-xl font-semibold">
                  {fmt1(window.cardiac_risk_score)}
                </p>
              </div>
            </div>

            {window.summary ? (
              <p className="text-sm text-muted-foreground">{window.summary}</p>
            ) : null}

            {!compact && chartData.length > 0 ? (
              <div className="h-[240px] w-full min-w-0 max-w-full overflow-hidden sm:h-[280px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={CHART.grid}
                    />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11, fill: CHART.tick }}
                      stroke={CHART.grid}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="bp"
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 11, fill: CHART.tick }}
                      stroke={CHART.grid}
                      tickLine={false}
                      width={40}
                    />
                    <YAxis
                      yAxisId="risk"
                      orientation="right"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: CHART.tick }}
                      stroke={CHART.grid}
                      tickLine={false}
                      width={36}
                    />
                    <Tooltip
                      content={<CnnChartTooltip />}
                      cursor={{ stroke: CHART.tick, strokeDasharray: '4 4' }}
                    />
                    <Legend
                      wrapperStyle={{ color: 'var(--foreground)', fontSize: 12 }}
                    />
                    <Line
                      yAxisId="bp"
                      type="monotone"
                      dataKey="sbp"
                      name="SBP"
                      stroke={CHART.sbp}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: CHART.sbp }}
                      connectNulls
                    />
                    <Line
                      yAxisId="bp"
                      type="monotone"
                      dataKey="dbp"
                      name="DBP"
                      stroke={CHART.dbp}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: CHART.dbp }}
                      connectNulls
                    />
                    <Line
                      yAxisId="risk"
                      type="monotone"
                      dataKey="cardiac"
                      name="Cardiac risk"
                      stroke={CHART.cardiac}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: CHART.cardiac }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
