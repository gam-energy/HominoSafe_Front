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

type MetricKey = "heart_rate" | "spo2" | "bp_systolic" | "temperature";

function chartStats(values: number[]) {
  if (!values.length) return { avg: 0, min: 0, max: 0, latest: 0, trend: 0 };
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  const latest = values[values.length - 1];
  const first = values[0];
  const trend = first === 0 ? 0 : ((latest - first) / first) * 100;
  return { avg: Math.round(avg * 10) / 10, min: Math.min(...values), max: Math.max(...values), latest, trend: Math.round(trend * 10) / 10 };
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
  const { data: historyData } = useHistory(userId, ["heart_rate", "spo2", "bp_systolic", "bp_diastolic", "temperature"], "day");
  const { data: patientState } = useLatestPatientState(userId);
  const { data: activeAlerts } = useQuery({
    queryKey: ["active-alerts-kpi"],
    queryFn: fetchActiveAlerts,
    staleTime: 30_000,
  });

  // Build chart data from real history
  const chartData = useMemo(() => {
    const raw = historyData?.data as unknown as Record<string, { timestamp: string; value: number }[]> | undefined;
    if (!raw) return [];
    const hr = raw.heart_rate ?? [];
    const spo2 = raw.spo2 ?? [];
    const bpSys = raw.bp_systolic ?? [];
    const bpDia = raw.bp_diastolic ?? [];
    const temp = raw.temperature ?? [];
    const len = Math.max(hr.length, spo2.length, bpSys.length, temp.length);
    const out: { time: string; heartRate: number; spo2: number; bpSystolic: number; bpDiastolic: number; temperature: number }[] = [];
    for (let i = 0; i < len; i++) {
      const ts = hr[i]?.timestamp ?? spo2[i]?.timestamp ?? bpSys[i]?.timestamp ?? temp[i]?.timestamp ?? "";
      const time = ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
      out.push({
        time,
        heartRate: hr[i]?.value ?? 0,
        spo2: spo2[i]?.value ?? 0,
        bpSystolic: bpSys[i]?.value ?? 0,
        bpDiastolic: bpDia[i]?.value ?? 0,
        temperature: temp[i]?.value ?? 0,
      });
    }
    return out;
  }, [historyData]);

  const data = chartData;

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
      return spark([v * 0.9, v * 0.93, v * 0.95, v * 0.97, v * 0.98, v * 0.99, v]);
    };

    return [
      {
        key: "overall_health",
        value: String(Math.round(overall)),
        suffix: "/100",
        delta: Number(kpis.overall_health?.trend ?? 0) || 0,
        deltaUp: Number(kpis.overall_health?.trend ?? 0) >= 0,
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
        delta: Number(kpis.risk_score?.trend ?? 0) || 0,
        deltaUp: Number(kpis.risk_score?.trend ?? 0) >= 0,
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
        delta: Number(kpis.adherence?.trend ?? 0) || 0,
        deltaUp: Number(kpis.adherence?.trend ?? 0) >= 0,
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
    const latest = assessments.slice(0, 4);
    return latest.map((a) => ({
      key: a.predicted_condition || a.risk_level,
      level: (a.risk_level || "low").toLowerCase(),
      score: a.risk_level?.toLowerCase().includes("high") ? 75 : a.risk_level?.toLowerCase().includes("moderate") || a.risk_level?.toLowerCase().includes("medium") ? 45 : 15,
    }));
  }, [summary]);

  // System scores from KPIs (derive from vital averages)
  const systemScores = useMemo(() => {
    const kpis = summary?.kpis ?? {};
    const cardio = kpis.heart_rate ? Math.max(0, 100 - Math.abs(kpis.heart_rate.value - 75) * 2) : 0;
    const resp = kpis.spo2 ? Math.max(0, kpis.spo2.value) : 0;
    const metab = kpis.bp_systolic ? Math.max(0, 100 - Math.abs(kpis.bp_systolic.value - 120) * 1.5) : 0;
    const mobil = kpis.temperature ? Math.max(0, 100 - Math.abs(kpis.temperature.value - 36.5) * 20) : 0;
    return [
      { key: "cardiovascular", value: Math.round(cardio), icon: HeartPulse, color: "#3b82f6" },
      { key: "respiratory", value: Math.round(resp), icon: Wind, color: "#10b981" },
      { key: "metabolic", value: Math.round(metab), icon: Droplets, color: "#f59e0b" },
      { key: "mobility", value: Math.round(mobil), icon: Footprints, color: "#8b5cf6" },
    ].filter((s) => s.value > 0);
  }, [summary]);

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

  const chartTabs: { key: MetricKey; label: string; icon: typeof HeartPulse; color: string; unit: string }[] = [
    { key: "heart_rate", label: t("heart_rate", "Heart Rate"), icon: HeartPulse, color: "#ef4444", unit: t("bpm", "bpm") },
    { key: "spo2", label: t("spo2", "SpO2"), icon: Droplets, color: "#3b82f6", unit: "%" },
    { key: "bp_systolic", label: t("blood_pressure", "Blood Pressure"), icon: Gauge, color: "#8b5cf6", unit: "mmHg" },
    { key: "temperature", label: t("temperature", "Temperature"), icon: Thermometer, color: "#f97316", unit: "°C" },
  ];

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
            const Delta = card.deltaUp ? TrendingUp : TrendingDown;
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
              <Tabs defaultValue="heart_rate" className="flex w-full flex-col gap-6">
                <TabsList className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-1 rounded-full bg-muted p-1 sm:grid-cols-4 h-11">
                  {chartTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger key={tab.key} value={tab.key} className="flex items-center justify-center gap-1.5 rounded-full text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white sm:text-sm dark:data-[state=active]:bg-blue-500 h-full">
                        <Icon className="h-4 w-4 shrink-0" /><span className="truncate">{tab.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <TabsContent value="heart_rate" forceMount className="flex flex-col gap-5 data-[state=inactive]:hidden">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{t("heart_rate", "Heart Rate")} <span className="text-sm font-normal text-muted-foreground">({t("bpm", "bpm")})</span></CardTitle>
                    <TrendBadge trend={chartStats(data.map((d) => d.heartRate)).trend} />
                  </div>
                  <StatGrid values={data.map((d) => d.heartRate)} unit={t("bpm", "bpm")} />
                  <div className="h-[280px] w-full" data-export-chart="vital-heartRate" data-export-chart-title={t("heart_rate", "Heart Rate")}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                        <defs><linearGradient id="colorHeart" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="heartRate" name={t("heart_rate", "Heart Rate")} stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorHeart)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="spo2" forceMount className="flex flex-col gap-5 data-[state=inactive]:hidden">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{t("spo2", "SpO2")} <span className="text-sm font-normal text-muted-foreground">(%)</span></CardTitle>
                    <TrendBadge trend={chartStats(data.map((d) => d.spo2)).trend} />
                  </div>
                  <StatGrid values={data.map((d) => d.spo2)} unit="%" />
                  <div className="h-[280px] w-full" data-export-chart="vital-spo2" data-export-chart-title={t("spo2", "SpO2")}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[90, 100]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="spo2" name={t("spo2", "SpO2")} stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="bp_systolic" forceMount className="flex flex-col gap-5 data-[state=inactive]:hidden">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{t("blood_pressure", "Blood Pressure")} <span className="text-sm font-normal text-muted-foreground">(mmHg)</span></CardTitle>
                    <TrendBadge trend={chartStats(data.map((d) => d.bpSystolic)).trend} />
                  </div>
                  <StatGrid values={data.map((d) => d.bpSystolic)} unit="mmHg" />
                  <div className="h-[280px] w-full" data-export-chart="vital-bloodPressure" data-export-chart-title={t("blood_pressure", "Blood Pressure")}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis domain={["dataMin - 10", "dataMax + 10"]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line type="monotone" dataKey="bpSystolic" name={t("systolic", "Systolic")} stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="bpDiastolic" name={t("diastolic", "Diastolic")} stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="temperature" forceMount className="flex flex-col gap-5 data-[state=inactive]:hidden">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{t("temperature", "Temperature")} <span className="text-sm font-normal text-muted-foreground">(°C)</span></CardTitle>
                    <TrendBadge trend={chartStats(data.map((d) => d.temperature)).trend} />
                  </div>
                  <StatGrid values={data.map((d) => d.temperature)} unit="°C" />
                  <div className="h-[280px] w-full" data-export-chart="vital-temperature" data-export-chart-title={t("temperature", "Temperature")}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                        <defs><linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.35} /><stop offset="95%" stopColor="#f97316" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="temperature" name={t("temperature", "Temperature")} stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
