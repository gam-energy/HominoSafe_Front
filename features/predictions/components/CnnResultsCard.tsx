'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
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
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const CHART = {
  sbp: '#0f766e',
  dbp: '#0891b2',
  cardiac: '#e11d48',
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
    return 'border-rose-400/40 bg-rose-500/10 text-rose-800 dark:text-rose-300';
  }
  if (l.includes('moderate') || l === 'medium') {
    return 'border-amber-400/40 bg-amber-500/10 text-amber-900 dark:text-amber-300';
  }
  return 'border-teal-400/40 bg-teal-500/10 text-teal-900 dark:text-teal-300';
}

function riskRingColor(level?: string | null) {
  const l = (level || '').toLowerCase();
  if (l.includes('critical') || l === 'high') return '#e11d48';
  if (l.includes('moderate') || l === 'medium') return '#d97706';
  return '#0d9488';
}

function CnnChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    dataKey?: string;
  }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-popover-foreground shadow-sm">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry) => {
        const unit = entry.dataKey === 'cardiac' ? '' : ' mmHg';
        return (
          <p
            key={entry.dataKey ?? entry.name}
            className="ltr-nums text-sm font-semibold text-foreground"
          >
            <span
              className="me-1.5 inline-block h-2 w-2 rounded-sm"
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

function MetricTile({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  accent: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="group relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card to-muted/30 p-4"
    >
      <div
        aria-hidden
        className={cn(
          'absolute inset-y-0 end-0 w-1/3 opacity-30 transition-opacity group-hover:opacity-50',
          accent
        )}
        style={{
          maskImage: 'linear-gradient(90deg, transparent, black)',
        }}
      />
      <div className="relative space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <p className="ltr-nums font-[family-name:var(--font-instrument)] text-2xl font-semibold tracking-tight text-foreground sm:text-[1.7rem]">
          {value}
        </p>
        {hint ? (
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    </motion.div>
  );
}

function RiskOrbit({
  score,
  level,
  label,
}: {
  score?: number | null;
  level?: string | null;
  label: string;
}) {
  const pct = Math.max(0, Math.min(100, score ?? 0));
  const color = riskRingColor(level);
  const r = 54;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="relative mx-auto flex h-36 w-36 items-center justify-center sm:h-40 sm:w-40">
      <svg viewBox="0 0 140 140" className="absolute inset-0 h-full w-full -rotate-90">
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/60"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${dash} ${c}` }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="relative z-10 text-center">
        <p className="ltr-nums font-[family-name:var(--font-instrument)] text-3xl font-semibold tracking-tight">
          {score != null ? score.toFixed(0) : '—'}
        </p>
        <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          {label}
        </p>
      </div>
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
    <section className="min-w-0 overflow-hidden rounded-[1.5rem] border border-border/70 bg-card shadow-sm">
      <div className="relative border-b border-border/60 px-4 py-5 sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,hsl(186_60%_45%/0.06),transparent_40%,hsl(221_70%_50%/0.05))]"
        />
        <div className="relative flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="flex items-center gap-2 font-[family-name:var(--font-instrument)] text-xl font-semibold tracking-tight">
              <Activity className="h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
              <span className="break-words">
                {t('cnn_vitals_predictions', 'CNN vitals predictions')}
              </span>
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {data?.description ??
                t(
                  'cnn_results_desc',
                  'Edge BiLSTM-CNN estimates from the connected watch stream.'
                )}
            </p>
          </div>
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold',
              data?.watch_connected
                ? 'border-teal-500/30 bg-teal-500/10 text-teal-800 dark:text-teal-200'
                : 'border-border bg-muted/50 text-muted-foreground'
            )}
          >
            <Watch className="h-3.5 w-3.5" />
            {data?.watch_connected
              ? t('watch_connected', 'Watch connected')
              : t('watch_offline', 'Watch offline')}
          </div>
        </div>
      </div>

      <div className="min-w-0 space-y-5 px-4 py-5 sm:px-6 sm:pb-6">
        {isLoading ? (
          <div className="flex items-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('loading', 'Loading...')}
          </div>
        ) : isError ? (
          <p className="text-sm text-destructive">
            {error?.message ||
              t('failed_load_cnn', 'Failed to load CNN predictions.')}
          </p>
        ) : !window ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-12 text-center">
            <Watch className="h-8 w-8 text-muted-foreground/40" />
            <p className="max-w-sm text-sm text-muted-foreground">
              {t(
                'no_cnn_windows',
                'No CNN prediction windows yet. Waiting for watch PPG/ECG samples.'
              )}
            </p>
          </div>
        ) : (
          <>
            <div className="grid items-center gap-6 lg:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center gap-3">
                <RiskOrbit
                  score={window.cardiac_risk_score}
                  level={window.cardiac_level}
                  label={t('risk', 'Risk')}
                />
                <span
                  className={cn(
                    'rounded-xl border px-3 py-1 text-[11px] font-bold tracking-wider uppercase',
                    levelTone(window.cardiac_level)
                  )}
                >
                  {window.cardiac_level || 'n/a'}{' '}
                  {t('cardiac_risk', 'cardiac risk')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MetricTile
                  icon={Gauge}
                  label={t('blood_pressure', 'Blood pressure')}
                  value={
                    window.sbp_mmhg != null && window.dbp_mmhg != null
                      ? `${Math.round(window.sbp_mmhg)}/${Math.round(window.dbp_mmhg)}`
                      : '—'
                  }
                  hint="mmHg · predicted"
                  accent="bg-teal-500"
                  delay={0.05}
                />
                <MetricTile
                  icon={HeartPulse}
                  label={t('af_probability', 'AF probability')}
                  value={fmt2(
                    window.af_probability != null
                      ? window.af_probability * 100
                      : null,
                    '%'
                  )}
                  hint={t('atrial_fib', 'Atrial fibrillation')}
                  accent="bg-rose-500"
                  delay={0.1}
                />
                <MetricTile
                  icon={Waves}
                  label="RMSSD"
                  value={fmt1(window.rmssd_ms, ' ms')}
                  hint="HRV variability"
                  accent="bg-cyan-500"
                  delay={0.15}
                />
                <MetricTile
                  icon={ShieldAlert}
                  label={t('cardiac_score', 'Cardiac score')}
                  value={fmt1(window.cardiac_risk_score)}
                  hint={data?.model_version ?? 'cnn-cardiac-v1'}
                  accent="bg-primary"
                  delay={0.2}
                />
              </div>
            </div>

            {window.summary ? (
              <p className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                {window.summary}
              </p>
            ) : null}

            {!compact && chartData.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-end justify-between gap-2">
                  <h3 className="font-[family-name:var(--font-instrument)] text-sm font-semibold tracking-tight">
                    {t('recent_window_trend', 'Recent window trend')}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {t('last_n_windows', 'Last {{n}} windows', {
                      n: chartData.length,
                    })}
                  </p>
                </div>
                <div className="h-[220px] w-full min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-muted/15 p-2 sm:h-[280px] sm:p-3">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart
                      data={chartData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="sbpFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART.sbp} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={CHART.sbp} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="dbpFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART.dbp} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={CHART.dbp} stopOpacity={0} />
                        </linearGradient>
                      </defs>
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
                        wrapperStyle={{
                          color: 'var(--foreground)',
                          fontSize: 12,
                        }}
                      />
                      <Area
                        yAxisId="bp"
                        type="monotone"
                        dataKey="sbp"
                        name="SBP"
                        stroke={CHART.sbp}
                        fill="url(#sbpFill)"
                        strokeWidth={2.25}
                        dot={false}
                        activeDot={{ r: 4 }}
                        connectNulls
                      />
                      <Area
                        yAxisId="bp"
                        type="monotone"
                        dataKey="dbp"
                        name="DBP"
                        stroke={CHART.dbp}
                        fill="url(#dbpFill)"
                        strokeWidth={2.25}
                        dot={false}
                        activeDot={{ r: 4 }}
                        connectNulls
                      />
                      <Line
                        yAxisId="risk"
                        type="monotone"
                        dataKey="cardiac"
                        name="Cardiac risk"
                        stroke={CHART.cardiac}
                        strokeWidth={2.25}
                        dot={false}
                        activeDot={{ r: 4 }}
                        connectNulls
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
