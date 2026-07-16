'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { cn } from '@/lib/utils';
import { useDashboardPrefs } from '@/features/settings/hooks/useDashboardPrefs';

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

/* ================= TYPES ================= */

export type Metric =
  | 'heart_rate'
  | 'spo2'
  | 'bp_systolic'
  | 'bp_diastolic'
  | 'temperature'
  | 'body_temperature'
  | 'humidity'
  | 'mq2';

export type TimePeriod = 'day' | 'week' | 'month';

type HistoryDataPoint = {
  timestamp: string;
  value: number;
};

type HistoryChartProps = {
  data: HistoryDataPoint[];
  metric: Metric;
  timePeriod: TimePeriod;
  unit?: string;
  className?: string;
  setMetric?: (metric: Metric) => void;
  setTimePeriod: (period: TimePeriod) => void;
  /** Hide metric dropdown (used when parent stacks all charts). */
  hideMetricSelect?: boolean;
  /** Optional title override for stacked charts. */
  title?: string;
};

export const ALL_HISTORY_METRICS: Metric[] = [
  'heart_rate',
  'spo2',
  'bp_systolic',
  'bp_diastolic',
  'temperature',
  'body_temperature',
  'humidity',
  'mq2',
];

/* ================= CONSTANTS ================= */

const METRIC_OPTIONS: { label: string; value: Metric }[] = [
  { label: 'Heart Rate', value: 'heart_rate' },
  { label: 'SpO₂', value: 'spo2' },
  { label: 'BP Systolic', value: 'bp_systolic' },
  { label: 'BP Diastolic', value: 'bp_diastolic' },
  { label: 'Temperature', value: 'temperature' },
  { label: 'Body Temperature', value: 'body_temperature' },
  { label: 'Humidity', value: 'humidity' },
  { label: 'MQ2', value: 'mq2' },
];

const TIME_OPTIONS: { label: string; value: TimePeriod }[] = [
  { label: 'Last Day', value: 'day' },
  { label: 'Last Week', value: 'week' },
  { label: 'Last Month', value: 'month' },
];

const METRIC_COLORS: Record<Metric, string> = {
  heart_rate: '#f43f5e',
  spo2: '#3b82f6',
  bp_systolic: '#8b5cf6',
  bp_diastolic: '#a78bfa',
  temperature: '#f97316',
  body_temperature: '#fb7185',
  humidity: '#38bdf8',
  mq2: '#eab308',
};

/** Target max points rendered — keeps week/month charts readable. */
const MAX_POINTS: Record<TimePeriod, number> = {
  day: 96, // ~15 min
  week: 84, // ~2 h
  month: 90, // ~8 h
};

const BUCKET_MS: Record<TimePeriod, number> = {
  day: 15 * 60 * 1000,
  week: 2 * 60 * 60 * 1000,
  month: 8 * 60 * 60 * 1000,
};

/**
 * Average values into fixed time buckets, then cap total points.
 * Preserves trend without plotting every raw sample.
 */
export function downsampleHistory(
  points: HistoryDataPoint[],
  timePeriod: TimePeriod
): HistoryDataPoint[] {
  if (points.length === 0) return points;

  // Always bucket so sparse-but-noisy series still read as a trend.
  const bucketMs = BUCKET_MS[timePeriod];
  if (points.length <= MAX_POINTS[timePeriod] && points.length <= 48) {
    return points;
  }

  const buckets = new Map<number, { sum: number; count: number }>();

  for (const p of points) {
    const t = new Date(p.timestamp).getTime();
    if (!Number.isFinite(t) || !Number.isFinite(p.value)) continue;
    const key = Math.floor(t / bucketMs) * bucketMs;
    const cur = buckets.get(key);
    if (cur) {
      cur.sum += p.value;
      cur.count += 1;
    } else {
      buckets.set(key, { sum: p.value, count: 1 });
    }
  }

  let aggregated = [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ts, { sum, count }]) => ({
      timestamp: new Date(ts + bucketMs / 2).toISOString(),
      value: Math.round((sum / count) * 10) / 10,
    }));

  // Safety cap if still too dense (e.g. long month ranges).
  const max = MAX_POINTS[timePeriod];
  if (aggregated.length > max) {
    const step = aggregated.length / max;
    const thinned: HistoryDataPoint[] = [];
    for (let i = 0; i < max; i++) {
      const idx = Math.min(aggregated.length - 1, Math.floor(i * step));
      thinned.push(aggregated[idx]);
    }
    // Always keep last point for currency.
    const last = aggregated[aggregated.length - 1];
    if (thinned[thinned.length - 1]?.timestamp !== last.timestamp) {
      thinned[thinned.length - 1] = last;
    }
    aggregated = thinned;
  }

  return aggregated;
}

/* ================= COMPONENT ================= */

export function HistoryChart({
  data,
  metric,
  timePeriod,
  unit,
  className = '',
  setMetric,
  setTimePeriod,
  hideMetricSelect = false,
  title,
}: HistoryChartProps) {
  const { prefs } = useDashboardPrefs();
  const compact = prefs.compactCharts;

  const filteredData = useMemo(() => {
    const clean = Array.isArray(data)
      ? data.filter((d) => d.timestamp && d.value != null && !isNaN(d.value))
      : [];
    return downsampleHistory(clean, timePeriod);
  }, [data, timePeriod]);

  const color = METRIC_COLORS[metric] ?? '#6366F1';
  const label =
    title ??
    METRIC_OPTIONS.find((m) => m.value === metric)?.label ??
    metric.replace('_', ' ');

  const chartData = {
    labels: filteredData.map((d) => new Date(d.timestamp)),
    datasets: [
      {
        label: `${label}${unit ? ` (${unit})` : ''}`,
        data: filteredData.map((d) => d.value),
        borderColor: color,
        backgroundColor: color + '22',
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHitRadius: 12,
        borderWidth: 2.25,
        spanGaps: true,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: !hideMetricSelect,
        position: 'top',
        labels: {
          boxWidth: 10,
          font: { size: compact ? 10 : 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const y = ctx.parsed.y;
            const formatted =
              typeof y === 'number' ? (Number.isInteger(y) ? String(y) : y.toFixed(1)) : String(y);
            return `${formatted}${unit ? ` ${unit}` : ''}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit:
            timePeriod === 'day'
              ? 'hour'
              : timePeriod === 'week'
                ? 'day'
                : 'week',
          tooltipFormat: 'yyyy/MM/dd HH:mm',
          displayFormats: {
            hour: 'HH:mm',
            day: 'MMM d',
            week: 'MMM d',
          },
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: compact ? 4 : 6,
          font: { size: compact ? 9 : 11 },
        },
        title: { display: false },
        grid: { color: 'rgba(128,128,128,0.12)' },
      },
      y: {
        beginAtZero: false,
        ticks: {
          maxTicksLimit: compact ? 4 : 6,
          font: { size: compact ? 9 : 11 },
        },
        title: { display: false },
        grid: { color: 'rgba(128,128,128,0.12)' },
      },
    },
  };

  return (
    <div className={cn('flex w-full min-w-0 flex-col', className)}>
      <div className="mb-2 flex w-full flex-col gap-2 sm:mb-3 sm:flex-row sm:flex-wrap sm:items-center">
        {!hideMetricSelect && setMetric && (
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as Metric)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm sm:w-auto sm:py-1.5"
          >
            {METRIC_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
        {hideMetricSelect && (
          <p className="text-sm font-semibold tracking-tight">
            {label}
            {unit ? (
              <span className="ms-1 text-xs font-medium text-muted-foreground">
                ({unit})
              </span>
            ) : null}
          </p>
        )}
        {!hideMetricSelect && (
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm sm:w-auto sm:py-1.5"
          >
            {TIME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div
        className={cn(
          'relative w-full min-w-0',
          compact ? 'h-[180px] sm:h-[220px]' : 'h-[220px] sm:h-[280px]'
        )}
      >
        {filteredData.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No data available for this metric.
            </p>
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
}

/** Shared time-period control for stacked history charts. */
export function HistoryPeriodSelect({
  timePeriod,
  setTimePeriod,
  className,
}: {
  timePeriod: TimePeriod;
  setTimePeriod: (period: TimePeriod) => void;
  className?: string;
}) {
  return (
    <select
      value={timePeriod}
      onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
      className={cn(
        'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm sm:w-auto sm:py-1.5',
        className
      )}
    >
      {TIME_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
