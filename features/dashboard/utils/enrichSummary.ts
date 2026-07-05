import type { DashboardData } from '@/features/dashboard/types/patient/overview';
import type { SummaryData } from '@/features/dashboard/types/patient/summery';
import type { KPI } from '@/features/dashboard/types/patient/summery';

function kpi(
  value: number | null | undefined,
  unit: string,
  trend = 'stable'
): KPI | undefined {
  if (value == null || Number.isNaN(value)) return undefined;
  return {
    value,
    trend,
    average_last_24h: value,
    average_last_7d: null,
    unit,
  };
}

export function enrichSummary(
  summary: SummaryData | undefined,
  live: DashboardData | undefined,
  userId: number
): SummaryData {
  const wearable = live?.wearable;
  const environmental = live?.environmental;
  const now = live?.metadata?.last_updated ?? summary?.last_updated ?? new Date().toISOString();

  const baseKpis = summary?.kpis ?? {};
  const kpis: Record<string, KPI> = { ...baseKpis };

  const mergeKpi = (key: string, incoming: KPI | undefined) => {
    if (!incoming) return;
    const existing = kpis[key];
    if (!existing?.value || existing.value === 0) {
      kpis[key] = incoming;
    }
  };

  mergeKpi('heart_rate', kpi(wearable?.heart_rate, 'bpm'));
  mergeKpi('bp_systolic', kpi(wearable?.bp_systolic, 'mmHg'));
  mergeKpi('bp_diastolic', kpi(wearable?.bp_diastolic, 'mmHg'));
  mergeKpi('spo2', kpi(wearable?.spo2, '%'));
  mergeKpi('temperature', kpi(wearable?.temperature, '°C'));
  mergeKpi('body_temperature', kpi(wearable?.temperature, '°C'));
  mergeKpi('humidity', kpi(environmental?.humidity, '%'));
  mergeKpi('mq2', kpi(environmental?.MQ25, 'µg/m³'));
  mergeKpi('CO2', kpi(environmental?.CO2, 'ppm'));

  const daily = summary?.daily_overview ?? {
    date: new Date().toISOString().slice(0, 10),
    avg_heart_rate: null,
    avg_spo2: null,
    max_bp_systolic: null,
    min_bp_diastolic: null,
  };

  return {
    user_id: summary?.user_id ?? userId,
    last_updated: now,
    kpis,
    recent_alerts: summary?.recent_alerts ?? [],
    risk_assessments: summary?.risk_assessments ?? [],
    daily_overview: {
      date: daily.date ?? new Date().toISOString().slice(0, 10),
      avg_heart_rate:
        daily.avg_heart_rate ??
        baseKpis.heart_rate?.average_last_24h ??
        wearable?.heart_rate ??
        null,
      avg_spo2:
        daily.avg_spo2 ??
        baseKpis.spo2?.average_last_24h ??
        wearable?.spo2 ??
        null,
      max_bp_systolic:
        daily.max_bp_systolic ??
        baseKpis.bp_systolic?.value ??
        wearable?.bp_systolic ??
        null,
      min_bp_diastolic:
        daily.min_bp_diastolic ??
        baseKpis.bp_diastolic?.value ??
        wearable?.bp_diastolic ??
        null,
    },
  };
}

export function hasOverviewContent(data: SummaryData, live?: DashboardData): boolean {
  const hasKpis = Object.values(data.kpis).some(
    (k) => k?.value != null && k.value !== 0
  );
  const hasDaily = Object.values(data.daily_overview).some(
    (v) => typeof v === 'number' && v != null
  );
  const hasAlerts = (data.recent_alerts?.length ?? 0) > 0;
  const hasLive = !!live?.wearable?.heart_rate;
  return hasKpis || hasDaily || hasAlerts || hasLive;
}
