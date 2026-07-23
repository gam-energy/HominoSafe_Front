"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import { HealthKpisExportMenu } from "@/features/dashboard/components/patient/HealthKpisExportMenu";
import type { HealthKpisReportData } from "@/features/dashboard/utils/exportHealthKpisReport";
import { useSummary } from "@/features/dashboard/api/patient/useGetSummary";
import { useHistory } from "@/features/dashboard/api/patient/useGetHistory";
import { useLatestPatientState } from "@/features/predictions/api/useLatestPatientState";
import { useCnnPredictions } from "@/features/predictions/api/useCnnPredictions";
import { useGetOVerview } from "@/features/dashboard/api/patient/useGetOverview";
import { useMyDevices } from "@/features/dashboard/api/patient/useDeviceLogin";
import { ActivityMeter, activityIntensity } from "@/features/dashboard/components/patient/ActivityMeter";
import { fetchActiveAlerts } from "@/features/alert/api/alertApi";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  HeartPulse,
  ShieldAlert,
  Pill,
  BellRing,
  TrendingUp,
  TrendingDown,
  Activity,
  Wind,
  Droplets,
  Footprints,
  Gauge,
  Thermometer,
  Minus,
} from "lucide-react";

/* ===================== helpers ===================== */

type MetricKey = "heart_rate" | "spo2" | "bp_systolic" | "body_temperature";

const CHART_BORDER = "var(--border)";
const CHART_TICK = "var(--muted-foreground)";

function chartStats(values: number[]) {
  if (!values.length) return { avg: 0, min: 0, max: 0, latest: 0, trend: 0 };
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  const latest = values[values.length - 1];
  const first = values[0];
  const trend = first === 0 ? 0 : ((latest - first) / first) * 100;
  return { avg: Math.round(avg * 10) / 10, min: Math.min(...values), max: Math.max(...values), latest, trend: Math.round(trend * 10) / 10 };
}

type SeriesPoint = { timestamp: string; value: number };

function formatTick(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/** Align multiple series onto shared bucket timestamps (average within bucket). */
function zipBucketed(
  series: Record<string, SeriesPoint[]>,
  bucketMs = 15 * 60 * 1000,
  maxPoints = 48,
): { time: string; ts: number; [k: string]: number | string }[] {
  const keys = Object.keys(series);
  const allTs = new Set<number>();
  const bucketed: Record<string, Map<number, number>> = {};

  for (const key of keys) {
    const map = new Map<number, { sum: number; count: number }>();
    for (const p of series[key] ?? []) {
      const t = new Date(p.timestamp).getTime();
      if (!Number.isFinite(t) || !Number.isFinite(p.value)) continue;
      const b = Math.floor(t / bucketMs) * bucketMs;
      allTs.add(b);
      const cur = map.get(b);
      if (cur) {
        cur.sum += p.value;
        cur.count += 1;
      } else {
        map.set(b, { sum: p.value, count: 1 });
      }
    }
    bucketed[key] = new Map(
      [...map.entries()].map(([b, { sum, count }]) => [
        b,
        Math.round((sum / count) * 10) / 10,
      ]),
    );
  }

  let stamps = [...allTs].sort((a, b) => a - b);
  if (stamps.length > maxPoints) {
    const step = stamps.length / maxPoints;
    const thinned: number[] = [];
    for (let i = 0; i < maxPoints; i++) {
      thinned.push(stamps[Math.min(stamps.length - 1, Math.floor(i * step))]);
    }
    stamps = thinned;
  }

  return stamps.map((ts) => {
    const row: { time: string; ts: number; [k: string]: number | string } = {
      time: formatTick(new Date(ts + bucketMs / 2).toISOString()),
      ts,
    };
    for (const key of keys) {
      const v = bucketed[key].get(ts);
      if (v != null) row[key] = v;
    }
    return row;
  });
}

function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="ltr-nums text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

function TrendBadge({ trend }: { trend: number }) {
  const isFlat = Math.abs(trend) < 0.5;
  const isUp = trend > 0;
  const Icon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", isFlat ? "bg-muted text-muted-foreground" : isUp ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400")}>
      <Icon className="h-3.5 w-3.5" />
      {!isFlat && <span className="ltr-nums">{Math.abs(trend)}%</span>}
    </span>
  );
}

function StatGrid({ values, unit }: { values: number[]; unit: string }) {
  const { t } = useTranslation();
  const s = chartStats(values);
  const items = [
    { label: t("latest", "Latest"), value: s.latest },
    { label: t("average", "Average"), value: s.avg },
    { label: t("minimum", "Min"), value: s.min },
    { label: t("maximum", "Max"), value: s.max },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-border bg-muted/40 p-3 text-center">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{item.label}</p>
          <p className="ltr-nums mt-1 text-lg font-bold">{item.value}<span className="ms-1 text-xs font-normal text-muted-foreground">{unit}</span></p>
        </div>
      ))}
    </div>
  );
}

const levelStyles: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  moderate: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  high: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  critical: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

const barColor: Record<string, string> = {
  low: "bg-emerald-500",
  moderate: "bg-amber-500",
  medium: "bg-amber-500",
  high: "bg-rose-500",
  critical: "bg-rose-500",
};

const spark = (vals: number[]) => vals.map((v, i) => ({ i, v }));

function ProgressRing({ value, color, exportTitle }: { value: number; color: string; exportTitle?: string }) {
  const data = [{ name: "score", value, fill: color }];
  return (
    <div className="relative h-28 w-28" data-export-chart={exportTitle ? `system-${exportTitle}` : undefined} data-export-chart-title={exportTitle}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="72%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background dataKey="value" cornerRadius={20} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="ltr-nums text-xl font-bold">{value}</span>
      </div>
    </div>
  );
}

/* ===================== panel ===================== */

export type HealthKpisPanelProps = {
  patientName?: string;
  userId?: number;
  backRoute?: string;
};

export function HealthKpisPanel({ patientName: patientNameProp, userId: userIdProp, backRoute }: HealthKpisPanelProps = {}) {
  const { t } = useTranslation();
  const { user } = useUser();
  const patientName = patientNameProp ?? (user ? `${user.first_name} ${user.last_name}`.trim() : undefined);
  const userId = userIdProp ?? user?.id ?? 0;

  // Real data hooks
  const { data: summary } = useSummary(userId);
  const isOwnProfile = !userIdProp || userIdProp === user?.id;
  const { data: myDevices } = useMyDevices(isOwnProfile);
  const { data: historyData } = useHistory(
    userId,
    [
      "heart_rate",
      "spo2",
      "bp_systolic",
      "bp_diastolic",
      "body_temperature",
      "humidity",
      "CO2",
      "mq2",
      "temperature",
    ],
    "day"
  );
  const { data: patientState } = useLatestPatientState(userId);
  const { data: cnn } = useCnnPredictions(userId);
  const { data: overview } = useGetOVerview(userId);
  const { data: activeAlerts } = useQuery({
    queryKey: ["active-alerts-kpi", userId],
    queryFn: fetchActiveAlerts,
    staleTime: 30_000,
    enabled: !!userId,
  });

  const watchOnline =
    myDevices?.devices?.some((d) => d.online) || !!cnn?.watch_connected;
  const watchActivity =
    myDevices?.devices?.find((d) => d.activity)?.activity ||
    summary?.latest_activity ||
    overview?.wearable?.activity ||
    null;
  const watchIntensity =
    myDevices?.devices?.find((d) => (d.activity_intensity ?? 0) > 0)
      ?.activity_intensity ?? activityIntensity(watchActivity);
  const watchBodyPosition =
    myDevices?.devices?.find((d) => d.body_position)?.body_position ||
    (overview?.wearable as { body_position?: string } | undefined)?.body_position ||
    null;
  // Build chart data from real history (bucketed for mobile readability)
  const { vitalsData, envData } = useMemo(() => {
    const raw = historyData?.data as unknown as
      | Record<string, SeriesPoint[]>
      | undefined;
    if (!raw) return { vitalsData: [], envData: [] };

    const vitalsData = zipBucketed(
      {
        heartRate: raw.heart_rate ?? [],
        spo2: raw.spo2 ?? [],
        bpSystolic: raw.bp_systolic ?? [],
        bpDiastolic: raw.bp_diastolic ?? [],
        temperature: raw.body_temperature ?? [],
      },
      15 * 60 * 1000,
      48,
    ).map((row) => ({
      time: String(row.time),
      heartRate: Number(row.heartRate ?? 0),
      spo2: Number(row.spo2 ?? 0),
      bpSystolic: Number(row.bpSystolic ?? 0),
      bpDiastolic: Number(row.bpDiastolic ?? 0),
      temperature: Number(row.temperature ?? 0),
    }));

    const envData = zipBucketed(
      {
        ambient: raw.temperature ?? [],
        humidity: raw.humidity ?? [],
        co2: raw.CO2 ?? [],
        mq2: raw.mq2 ?? [],
      },
      15 * 60 * 1000,
      48,
    ).map((row) => ({
      time: String(row.time),
      ambient: row.ambient != null ? Number(row.ambient) : undefined,
      humidity: row.humidity != null ? Number(row.humidity) : undefined,
      co2: row.co2 != null ? Number(row.co2) : undefined,
      mq2: row.mq2 != null ? Number(row.mq2) : undefined,
    }));

    return { vitalsData, envData };
  }, [historyData]);

  const data = vitalsData;
  const hasEnvData = envData.some(
    (d) =>
      d.humidity != null ||
      d.co2 != null ||
      d.ambient != null ||
      d.mq2 != null,
  );

  const envLatest = useMemo(() => {
    const last = [...envData].reverse().find(
      (d) =>
        d.humidity != null ||
        d.co2 != null ||
        d.ambient != null ||
        d.mq2 != null,
    );
    return last ?? null;
  }, [envData]);

  // Build hero cards from real KPIs
  const heroCards = useMemo(() => {
    const kpis = summary?.kpis ?? {};
    const alertCount = activeAlerts?.length ?? 0;
    const riskScore = kpis.risk_score?.value ?? 0;
    const overall = kpis.overall_health?.value ?? (riskScore > 0 ? 100 - Math.round(riskScore) : 0);
    const adherence = kpis.adherence?.value ?? 0;

    const trendArr = (k: string, fallback: number[]) => {
      const kpi = kpis[k];
      if (!kpi) return spark(fallback);
      const v = kpi.value;
      const base = kpi.average_last_24h ?? v;
      // Interpolate from the 24h baseline to the current value.
      return spark([0, 0.2, 0.4, 0.6, 0.8, 0.92, 1].map((f) => base + (v - base) * f));
    };

    // Delta = current value vs 24h average (rounded to 1 decimal).
    const deltaOf = (k: string) => {
      const kpi = kpis[k];
      if (!kpi || kpi.average_last_24h == null) return 0;
      return Math.round((kpi.value - kpi.average_last_24h) * 10) / 10;
    };

    return [
      {
        key: "overall_health",
        value: String(Math.round(overall)),
        suffix: "/100",
        delta: deltaOf("overall_health"),
        deltaUp: deltaOf("overall_health") >= 0,
        icon: HeartPulse,
        accent: "text-emerald-500",
        ring: "stroke-emerald-500",
        bg: "bg-emerald-500/10",
        trend: trendArr("overall_health", [74, 76, 75, 78, 80, 79, 82]),
        color: "#10b981",
      },
      {
        key: "risk_score",
        value: riskScore.toFixed(1),
        suffix: "/100",
        // For risk, an increase is bad — flip the "up is good" colour.
        delta: deltaOf("risk_score"),
        deltaUp: deltaOf("risk_score") <= 0,
        icon: ShieldAlert,
        accent: "text-amber-500",
        ring: "stroke-amber-500",
        bg: "bg-amber-500/10",
        trend: trendArr("risk_score", [48, 46, 45, 44, 43, 44, 42.7]),
        color: "#f59e0b",
      },
      {
        key: "adherence",
        value: String(Math.round(adherence)),
        suffix: "%",
        delta: deltaOf("adherence"),
        deltaUp: deltaOf("adherence") >= 0,
        icon: Pill,
        accent: "text-blue-500",
        ring: "stroke-blue-500",
        bg: "bg-blue-500/10",
        trend: trendArr("adherence", [88, 90, 91, 92, 93, 93, 94]),
        color: "#3b82f6",
      },
      {
        key: "active_alerts",
        value: String(alertCount),
        suffix: "",
        delta: 0,
        deltaUp: false,
        icon: BellRing,
        accent: "text-rose-500",
        ring: "stroke-rose-500",
        bg: "bg-rose-500/10",
        trend: spark([alertCount, alertCount, alertCount, alertCount, alertCount, alertCount, alertCount]),
        color: "#f43f5e",
      },
    ];
  }, [summary, activeAlerts, patientState]);

  // Risk breakdown from real risk assessments
  const riskBreakdown = useMemo(() => {
    const assessments = summary?.risk_assessments ?? [];
    if (assessments.length === 0) return [];
    const latest = assessments.slice(0, 6);
    return latest.map((a) => {
      const level = (a.risk_level || "low").toLowerCase();
      const parsed =
        typeof a.risk_score === "number"
          ? a.risk_score
          : Number(
              /Score:\s*([0-9]+(?:\.[0-9]+)?)/i.exec(
                a.predicted_condition || ""
              )?.[1]
            );
      const score = Number.isFinite(parsed)
        ? Number(parsed)
        : level.includes("critical")
          ? 90
          : level.includes("high")
            ? 75
            : level.includes("moderate") || level.includes("medium")
              ? 50
              : 20;
      return {
        key: a.predicted_condition || a.risk_level,
        level,
        score: Math.max(0, Math.min(100, score)),
      };
    });
  }, [summary]);

  // System scores from KPIs (derive from vital averages + activity)
  const systemScores = useMemo(() => {
    const kpis = summary?.kpis ?? {};
    const activity = (
      summary?.latest_activity ||
      overview?.wearable?.activity ||
      ""
    ).toLowerCase();
    const cardio = kpis.heart_rate
      ? Math.max(0, 100 - Math.abs(kpis.heart_rate.value - 75) * 2)
      : 0;
    const resp = kpis.spo2 ? Math.max(0, kpis.spo2.value) : 0;
    const metab = kpis.bp_systolic
      ? Math.max(0, 100 - Math.abs(kpis.bp_systolic.value - 120) * 1.5)
      : 0;
    const mobil = activity.includes("run")
      ? 92
      : activity.includes("walk")
        ? 80
        : activity.includes("stand")
          ? 65
          : activity.includes("sit")
            ? 45
            : activity.includes("sleep")
              ? 25
              : kpis.body_temperature
                ? Math.max(
                    0,
                    100 - Math.abs(kpis.body_temperature.value - 36.5) * 20
                  )
                : 0;
    return [
      { key: "cardiovascular", value: Math.round(cardio), icon: HeartPulse, color: "#3b82f6" },
      { key: "respiratory", value: Math.round(resp), icon: Wind, color: "#10b981" },
      { key: "metabolic", value: Math.round(metab), icon: Droplets, color: "#f59e0b" },
      { key: "mobility", value: Math.round(mobil), icon: Footprints, color: "#8b5cf6" },
    ].filter((s) => s.value > 0);
  }, [summary, overview]);

  const reportData = useMemo((): HealthKpisReportData => {
    const hrStats = chartStats(data.map((d) => d.heartRate));
    const spo2Stats = chartStats(data.map((d) => d.spo2));
    const bpSysStats = chartStats(data.map((d) => d.bpSystolic));
    const tempStats = chartStats(data.map((d) => d.temperature));
    return {
      patientName,
      userId,
      generatedAt: new Date().toLocaleString(),
      heroCards: heroCards.map((card) => ({ label: t(card.key), value: card.value, suffix: card.suffix, delta: card.delta, deltaUp: card.deltaUp })),
      systemScores: systemScores.map((s) => ({ label: t(s.key), value: s.value })),
      riskBreakdown: riskBreakdown.map((r) => ({ label: t(r.key), level: t(r.level), score: r.score })),
      vitals: [
        { label: t("heart_rate", "Heart Rate"), unit: t("bpm", "bpm"), ...hrStats, readings: data.map((d) => ({ time: d.time, display: `${d.heartRate} bpm` })) },
        { label: t("spo2", "SpO2"), unit: "%", ...spo2Stats, readings: data.map((d) => ({ time: d.time, display: `${d.spo2}%` })) },
        { label: t("blood_pressure", "Blood Pressure"), unit: "mmHg", ...bpSysStats, readings: data.map((d) => ({ time: d.time, display: `${d.bpSystolic}/${d.bpDiastolic} mmHg` })) },
        { label: t("temperature", "Temperature"), unit: "°C", ...tempStats, readings: data.map((d) => ({ time: d.time, display: `${d.temperature} °C` })) },
      ],
    };
  }, [data, heroCards, systemScores, riskBreakdown, t, patientName, userId]);

  const chartTabs: {
    key: MetricKey;
    label: string;
    short: string;
    icon: typeof HeartPulse;
    color: string;
    unit: string;
  }[] = [
    {
      key: "heart_rate",
      label: t("heart_rate", "Heart Rate"),
      short: t("hr_short", "HR"),
      icon: HeartPulse,
      color: "#ef4444",
      unit: t("bpm", "bpm"),
    },
    {
      key: "spo2",
      label: t("spo2", "SpO2"),
      short: "SpO2",
      icon: Droplets,
      color: "#3b82f6",
      unit: "%",
    },
    {
      key: "bp_systolic",
      label: t("blood_pressure", "Blood Pressure"),
      short: t("bp_short", "BP"),
      icon: Gauge,
      color: "#8b5cf6",
      unit: "mmHg",
    },
    {
      key: "body_temperature",
      label: t("body_temperature", "Body temp"),
      short: t("temp_short", "Temp"),
      icon: Thermometer,
      color: "#f97316",
      unit: "°C",
    },
  ];

  const activityLabel =
    watchActivity ||
    summary?.latest_activity ||
    overview?.wearable?.activity ||
    t("unknown", "Unknown");
  const bodyPosition =
    watchBodyPosition ||
    (overview?.wearable as { body_position?: string } | undefined)?.body_position ||
    activityLabel;

  const noData = data.length === 0;

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-col gap-6">
        {backRoute && (
          <Link href={backRoute} className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            ← {t('back_to_patient', 'Back to patient')}
          </Link>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <Heading
            title={patientName ? t('patient_kpi_dashboard', '{{name}} — Health KPIs', { name: patientName }) : t('kpi_dashboard')}
            description={t('kpi_description')}
          />
          <HealthKpisExportMenu buildReport={() => reportData} />
        </div>

        {/* Hero KPI cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {heroCards.map((card) => {
            const Icon = card.icon;
            // Arrow shows the direction of change; colour shows whether it's good.
            const Delta = card.delta === 0 ? Minus : card.delta > 0 ? TrendingUp : TrendingDown;
            return (
              <Card key={card.key} className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-center justify-between">
                    <div className={cn("rounded-xl p-2.5", card.bg)}><Icon className={cn("h-5 w-5", card.accent)} /></div>
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", card.deltaUp ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400")}>
                      <Delta className="h-3 w-3" /><span className="ltr-nums">{card.delta}</span>
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t(card.key)}</p>
                    <div className="mt-0.5 flex items-baseline gap-0.5">
                      <span className="ltr-nums text-2xl font-bold">{card.value}</span>
                      <span className="text-sm text-muted-foreground">{card.suffix}</span>
                    </div>
                  </div>
                  <div className="-mb-2 -mx-2 h-10" data-export-chart={`hero-${card.key}`} data-export-chart-title={t(card.key)}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={card.trend} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                        <defs><linearGradient id={`g-${card.key}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={card.color} stopOpacity={0.3} /><stop offset="100%" stopColor={card.color} stopOpacity={0} /></linearGradient></defs>
                        <Area type="monotone" dataKey="v" stroke={card.color} strokeWidth={2} fill={`url(#g-${card.key})`} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* System health rings */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm xl:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg"><Activity className="h-5 w-5 text-primary" />{t("key_metrics")}</CardTitle>
            </CardHeader>
            <CardContent>
              {systemScores.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{t("no_data", "No data available.")}</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 pt-2 sm:grid-cols-4">
                  {systemScores.map((s) => {
                    const Icon = s.icon;
                    return (
                      <div key={s.key} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/30 p-4">
                        <ProgressRing value={s.value} color={s.color} exportTitle={t(s.key)} />
                        <div className="flex items-center gap-1.5 text-sm font-medium"><Icon className="h-4 w-4 text-muted-foreground" />{t(s.key)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk breakdown */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg"><ShieldAlert className="h-5 w-5 text-primary" />{t("risk_breakdown")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-2">
              {riskBreakdown.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{t("no_data", "No risk assessments yet.")}</p>
              ) : (
                riskBreakdown.map((r, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{r.key}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", levelStyles[r.level] ?? levelStyles.low)}>{t(r.level)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className={cn("h-full rounded-full transition-all duration-500", barColor[r.level] ?? barColor.low)} style={{ width: `${r.score}%` }} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Vital Signs Charts */}
        <Card className="rounded-2xl border border-border shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg"><Activity className="h-5 w-5 text-primary" />{t("vital_trends", "Vital Sign Trends")}</CardTitle>
            <CardDescription>{t("vital_trends_desc", "Last 24-hour readings")}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {noData ? (
              <div className="flex h-[280px] w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <div className="rounded-full bg-muted p-4"><Activity className="h-8 w-8 opacity-20" /></div>
                <p>{t("no_data", "No vitals data yet. Waiting for watch readings...")}</p>
              </div>
            ) : (
              <Tabs defaultValue="heart_rate" className="flex w-full flex-col gap-5">
                <TabsList className="flex h-auto w-full gap-1 overflow-x-auto rounded-xl bg-muted p-1 sm:grid sm:grid-cols-4 sm:overflow-visible">
                  {chartTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger
                        key={tab.key}
                        value={tab.key}
                        className="h-10 shrink-0 flex-none gap-1.5 rounded-lg px-3 text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm sm:flex-1 sm:px-2 sm:text-sm dark:data-[state=active]:bg-blue-500"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="sm:hidden">{tab.short}</span>
                        <span className="hidden truncate sm:inline">{tab.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <TabsContent value="heart_rate" forceMount className="flex flex-col gap-4 data-[state=inactive]:hidden">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg">{t("heart_rate", "Heart Rate")} <span className="text-sm font-normal text-muted-foreground">({t("bpm", "bpm")})</span></CardTitle>
                    <TrendBadge trend={chartStats(data.map((d) => d.heartRate)).trend} />
                  </div>
                  <StatGrid values={data.map((d) => d.heartRate)} unit={t("bpm", "bpm")} />
                  <div className="h-[220px] w-full sm:h-[280px]" data-export-chart="vital-heartRate" data-export-chart-title={t("heart_rate", "Heart Rate")}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                        <defs><linearGradient id="colorHeart" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_BORDER} />
                        <XAxis dataKey="time" tick={{ fontSize: 11, fill: CHART_TICK }} axisLine={false} tickLine={false} minTickGap={28} interval="preserveStartEnd" />
                        <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fontSize: 11, fill: CHART_TICK }} axisLine={false} tickLine={false} width={36} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="heartRate" name={t("heart_rate", "Heart Rate")} stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorHeart)" dot={false} activeDot={{ r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="spo2" forceMount className="flex flex-col gap-4 data-[state=inactive]:hidden">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg">{t("spo2", "SpO2")} <span className="text-sm font-normal text-muted-foreground">(%)</span></CardTitle>
                    <TrendBadge trend={chartStats(data.map((d) => d.spo2)).trend} />
                  </div>
                  <StatGrid values={data.map((d) => d.spo2)} unit="%" />
                  <div className="h-[220px] w-full sm:h-[280px]" data-export-chart="vital-spo2" data-export-chart-title={t("spo2", "SpO2")}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                        <defs><linearGradient id="colorSpo2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_BORDER} />
                        <XAxis dataKey="time" tick={{ fontSize: 11, fill: CHART_TICK }} axisLine={false} tickLine={false} minTickGap={28} interval="preserveStartEnd" />
                        <YAxis domain={[90, 100]} tick={{ fontSize: 11, fill: CHART_TICK }} axisLine={false} tickLine={false} width={36} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="spo2" name={t("spo2", "SpO2")} stroke="#3b82f6" strokeWidth={2} fill="url(#colorSpo2)" dot={false} activeDot={{ r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="bp_systolic" forceMount className="flex flex-col gap-4 data-[state=inactive]:hidden">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg">{t("blood_pressure", "Blood Pressure")} <span className="text-sm font-normal text-muted-foreground">(mmHg)</span></CardTitle>
                    <TrendBadge trend={chartStats(data.map((d) => d.bpSystolic)).trend} />
                  </div>
                  <StatGrid values={data.map((d) => d.bpSystolic)} unit="mmHg" />
                  <div className="h-[220px] w-full sm:h-[280px]" data-export-chart="vital-bloodPressure" data-export-chart-title={t("blood_pressure", "Blood Pressure")}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_BORDER} />
                        <XAxis dataKey="time" tick={{ fontSize: 11, fill: CHART_TICK }} axisLine={false} tickLine={false} minTickGap={28} interval="preserveStartEnd" />
                        <YAxis domain={["dataMin - 10", "dataMax + 10"]} tick={{ fontSize: 11, fill: CHART_TICK }} axisLine={false} tickLine={false} width={36} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="bpSystolic" name={t("systolic", "Systolic")} stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="bpDiastolic" name={t("diastolic", "Diastolic")} stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="body_temperature" forceMount className="flex flex-col gap-4 data-[state=inactive]:hidden">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg">{t("body_temperature", "Body temperature")} <span className="text-sm font-normal text-muted-foreground">(°C)</span></CardTitle>
                    <TrendBadge trend={chartStats(data.map((d) => d.temperature)).trend} />
                  </div>
                  <StatGrid values={data.map((d) => d.temperature)} unit="°C" />
                  <div className="h-[220px] w-full sm:h-[280px]" data-export-chart="vital-temperature" data-export-chart-title={t("body_temperature", "Body temperature")}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                        <defs><linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.35} /><stop offset="95%" stopColor="#f97316" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_BORDER} />
                        <XAxis dataKey="time" tick={{ fontSize: 11, fill: CHART_TICK }} axisLine={false} tickLine={false} minTickGap={28} interval="preserveStartEnd" />
                        <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} tick={{ fontSize: 11, fill: CHART_TICK }} axisLine={false} tickLine={false} width={36} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="temperature" name={t("body_temperature", "Body temperature")} stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" dot={false} activeDot={{ r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Footprints className="h-5 w-5 text-primary" />
                {t("activity_posture", "Activity & body position")}
              </CardTitle>
              <CardDescription>
                {t(
                  "activity_posture_desc",
                  "Latest watch activity and inferred body position"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="col-span-2 rounded-xl border border-border/80 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase text-muted-foreground">
                    {t("body_activity_meter", "Body activity (watch)")}
                  </p>
                  <span
                    className={cn(
                      "text-[11px] font-medium rounded-full px-2 py-0.5",
                      watchOnline
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    {watchOnline
                      ? t("watch_online", "Online")
                      : t("watch_offline", "Watch offline")}
                  </span>
                </div>
                <ActivityMeter
                  activity={activityLabel === t("unknown", "Unknown") ? null : activityLabel}
                  intensity={watchIntensity}
                  bodyPosition={bodyPosition}
                />
              </div>
              <div className="rounded-xl border border-border/80 p-4">
                <p className="text-xs uppercase text-muted-foreground">
                  {t("activity", "Activity")}
                </p>
                <p className="mt-1 text-xl font-semibold">{activityLabel}</p>
              </div>
              <div className="rounded-xl border border-border/80 p-4">
                <p className="text-xs uppercase text-muted-foreground">
                  {t("body_position", "Body position")}
                </p>
                <p className="mt-1 text-xl font-semibold capitalize">
                  {bodyPosition}
                </p>
              </div>
              <div className="rounded-xl border border-border/80 p-4">
                <p className="text-xs uppercase text-muted-foreground">
                  {t("latest_hr", "Latest HR")}
                </p>
                <p className="mt-1 ltr-nums text-xl font-semibold">
                  {overview?.wearable?.heart_rate != null
                    ? `${Number(overview.wearable.heart_rate).toFixed(1)} bpm`
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border/80 p-4">
                <p className="text-xs uppercase text-muted-foreground">
                  {t("latest_spo2", "Latest SpO2")}
                </p>
                <p className="mt-1 ltr-nums text-xl font-semibold">
                  {overview?.wearable?.spo2 != null
                    ? `${Number(overview.wearable.spo2).toFixed(1)}%`
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldAlert className="h-5 w-5 text-primary" />
                {t("cnn_snapshot", "CNN snapshot")}
              </CardTitle>
              <CardDescription>
                {t(
                  "cnn_snapshot_desc",
                  "Latest BiLSTM-CNN predicted vitals from the watch stream"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/80 p-4">
                <p className="text-xs uppercase text-muted-foreground">BP</p>
                <p className="mt-1 ltr-nums text-xl font-semibold">
                  {cnn?.latest_window?.sbp_mmhg != null &&
                  cnn?.latest_window?.dbp_mmhg != null
                    ? `${Math.round(cnn.latest_window.sbp_mmhg)}/${Math.round(cnn.latest_window.dbp_mmhg)}`
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border/80 p-4">
                <p className="text-xs uppercase text-muted-foreground">
                  {t("cardiac_risk", "Cardiac risk")}
                </p>
                <p className="mt-1 ltr-nums text-xl font-semibold">
                  {cnn?.latest_window?.cardiac_risk_score != null
                    ? cnn.latest_window.cardiac_risk_score.toFixed(1)
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border/80 p-4">
                <p className="text-xs uppercase text-muted-foreground">AF %</p>
                <p className="mt-1 ltr-nums text-xl font-semibold">
                  {cnn?.latest_window?.af_probability != null
                    ? `${(cnn.latest_window.af_probability * 100).toFixed(1)}%`
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border/80 p-4">
                <p className="text-xs uppercase text-muted-foreground">
                  {t("watch", "Watch")}
                </p>
                <p className="mt-1 text-xl font-semibold">
                  {cnn?.watch_connected
                    ? t("connected", "Connected")
                    : t("offline", "Offline")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl border border-border shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wind className="h-5 w-5 text-primary" />
              {t("environment_trends", "Environment trends")}
            </CardTitle>
            <CardDescription>
              {t(
                "environment_trends_desc",
                "Room temperature, humidity, CO₂ and gas sensor (24h)"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {hasEnvData ? (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    {
                      label: t("room_temp", "Room °C"),
                      value: envLatest?.ambient,
                      unit: "°C",
                    },
                    {
                      label: t("humidity", "Humidity"),
                      value: envLatest?.humidity,
                      unit: "%",
                    },
                    {
                      label: "CO₂",
                      value: envLatest?.co2,
                      unit: "ppm",
                    },
                    {
                      label: "MQ2",
                      value: envLatest?.mq2,
                      unit: "",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-border/80 bg-muted/20 p-3"
                    >
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="mt-1 ltr-nums text-lg font-semibold">
                        {item.value != null
                          ? `${Number(item.value).toFixed(item.unit === "ppm" ? 0 : 1)}${item.unit ? ` ${item.unit}` : ""}`
                          : "—"}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="h-[220px] w-full sm:h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={envData} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_BORDER} />
                      <XAxis dataKey="time" tick={{ fontSize: 11, fill: CHART_TICK }} axisLine={false} tickLine={false} minTickGap={28} interval="preserveStartEnd" />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: CHART_TICK }} axisLine={false} tickLine={false} width={36} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: CHART_TICK }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line yAxisId="left" type="monotone" dataKey="ambient" name={t("room_temp", "Room °C")} stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
                      <Line yAxisId="left" type="monotone" dataKey="humidity" name={t("humidity", "Humidity %")} stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
                      <Line yAxisId="right" type="monotone" dataKey="co2" name="CO₂ ppm" stroke="#64748b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
                      <Line yAxisId="right" type="monotone" dataKey="mq2" name="MQ2" stroke="#eab308" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
                {t("no_env_data", "No environment history yet.")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
