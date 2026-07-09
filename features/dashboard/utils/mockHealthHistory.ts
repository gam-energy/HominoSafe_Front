import type { Metric, TimePeriod } from '@/features/dashboard/components/patient/HistoryChart';

type HistoryPoint = { timestamp: string; value: number };

const METRIC_UNITS: Partial<Record<Metric, string>> = {
  heart_rate: 'bpm',
  spo2: '%',
  bp_systolic: 'mmHg',
  bp_diastolic: 'mmHg',
  temperature: '°C',
  body_temperature: '°C',
  humidity: '%',
  mq2: 'ppm',
};

/** Sample vitals used across dashboard mock data. */
const SERIES: Partial<Record<Metric, number[]>> = {
  heart_rate: [72, 74, 76, 78, 80, 82, 79, 77, 75, 73, 71, 70, 69, 68, 70, 72, 74, 76, 78, 80, 76, 74, 73, 72],
  spo2: [98, 97, 99, 98, 97, 96, 98, 99, 97, 98, 99, 98, 97, 96, 98, 99, 98, 97, 99, 98, 97, 98, 99, 98],
  bp_systolic: [120, 122, 121, 119, 118, 117, 116, 115, 117, 119, 121, 123, 124, 122, 120, 118, 117, 119, 121, 120, 119, 118, 120, 121],
  bp_diastolic: [80, 81, 79, 78, 77, 76, 75, 74, 76, 78, 80, 82, 83, 81, 80, 78, 77, 79, 80, 81, 80, 79, 78, 80],
  temperature: [36.5, 36.6, 36.7, 36.8, 36.6, 36.5, 36.4, 36.3, 36.5, 36.6, 36.7, 36.8, 36.6, 36.5, 36.4, 36.3, 36.5, 36.6, 36.7, 36.8, 36.6, 36.5, 36.4, 36.5],
  body_temperature: [36.5, 36.6, 36.7, 36.8, 36.6, 36.5, 36.4, 36.3, 36.5, 36.6, 36.7, 36.8, 36.6, 36.5, 36.4, 36.3, 36.5, 36.6, 36.7, 36.8, 36.6, 36.5, 36.4, 36.5],
  humidity: [50, 52, 54, 53, 51, 50, 49, 48, 50, 52, 54, 53, 51, 50, 49, 48, 50, 52, 54, 53, 51, 50, 52, 51],
  mq2: [15, 16, 14, 13, 12, 13, 14, 15, 16, 15, 14, 13, 12, 13, 14, 15, 16, 15, 14, 13, 14, 15, 14, 13],
};

function pointCount(period: TimePeriod): number {
  switch (period) {
    case 'week':
      return 7;
    case 'month':
      return 30;
    default:
      return 24;
  }
}

function timestampForIndex(index: number, total: number, period: TimePeriod): string {
  const now = new Date();

  if (period === 'day') {
    const d = new Date(now);
    d.setHours(d.getHours() - (total - 1 - index));
    d.setMinutes(0, 0, 0);
    return d.toISOString();
  }

  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - (total - 1 - index));
    d.setHours(12, 0, 0, 0);
    return d.toISOString();
  }

  const d = new Date(now);
  d.setDate(d.getDate() - (total - 1 - index));
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

export function getMockHistoryUnit(metric: Metric): string | undefined {
  return METRIC_UNITS[metric];
}

/** Generates demo vitals history when the API returns no readings. */
export function generateMockHistorySeries(
  metric: Metric,
  timePeriod: TimePeriod
): HistoryPoint[] {
  const values = SERIES[metric] ?? SERIES.heart_rate!;
  const total = pointCount(timePeriod);

  return Array.from({ length: total }, (_, index) => ({
    timestamp: timestampForIndex(index, total, timePeriod),
    value: values[index % values.length],
  }));
}
