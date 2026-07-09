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

/* ===================== chart mock data ===================== */

const chartData = [
  { time: "08:00", heartRate: 72, spo2: 98, bpSystolic: 120, bpDiastolic: 80, temperature: 36.5 },
  { time: "09:00", heartRate: 75, spo2: 97, bpSystolic: 122, bpDiastolic: 82, temperature: 36.6 },
  { time: "10:00", heartRate: 80, spo2: 98, bpSystolic: 125, bpDiastolic: 85, temperature: 36.7 },
  { time: "11:00", heartRate: 78, spo2: 99, bpSystolic: 121, bpDiastolic: 81, temperature: 36.6 },
  { time: "12:00", heartRate: 85, spo2: 96, bpSystolic: 128, bpDiastolic: 88, temperature: 36.8 },
  { time: "13:00", heartRate: 74, spo2: 98, bpSystolic: 119, bpDiastolic: 79, temperature: 36.5 },
  { time: "14:00", heartRate: 70, spo2: 99, bpSystolic: 115, bpDiastolic: 75, temperature: 36.4 },
];

type MetricKey = "heartRate" | "spo2" | "bloodPressure" | "temperature";

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

/* ===================== kpi mock data ===================== */

const spark = (vals: number[]) => vals.map((v, i) => ({ i, v }));

const heroCards = [
  {
    key: "overall_health",
    value: "82",
    suffix: "/100",
    delta: 3.2,
    deltaUp: true,
    icon: HeartPulse,
    accent: "text-emerald-500",
    ring: "stroke-emerald-500",
    bg: "bg-emerald-500/10",
    trend: spark([74, 76, 75, 78, 80, 79, 82]),
    color: "#10b981",
  },
  {
    key: "risk_score",
    value: "42.7",
    suffix: "/100",
    delta: 1.4,
    deltaUp: false,
    icon: ShieldAlert,
    accent: "text-amber-500",
    ring: "stroke-amber-500",
    bg: "bg-amber-500/10",
    trend: spark([48, 46, 45, 44, 43, 44, 42.7]),
    color: "#f59e0b",
  },
  {
    key: "adherence",
    value: "94",
    suffix: "%",
    delta: 2.1,
    deltaUp: true,
    icon: Pill,
    accent: "text-blue-500",
    ring: "stroke-blue-500",
    bg: "bg-blue-500/10",
    trend: spark([88, 90, 91, 92, 93, 93, 94]),
    color: "#3b82f6",
  },
  {
    key: "active_alerts",
    value: "2",
    suffix: "",
    delta: 1,
    deltaUp: false,
    icon: BellRing,
    accent: "text-rose-500",
    ring: "stroke-rose-500",
    bg: "bg-rose-500/10",
    trend: spark([4, 3, 3, 2, 3, 2, 2]),
    color: "#f43f5e",
  },
];

const systemScores = [
  { key: "cardiovascular", value: 78, icon: HeartPulse, color: "#3b82f6" },
  { key: "respiratory", value: 91, icon: Wind, color: "#10b981" },
  { key: "metabolic", value: 64, icon: Droplets, color: "#f59e0b" },
  { key: "mobility", value: 85, icon: Footprints, color: "#8b5cf6" },
];

const riskBreakdown = [
  { key: "cardiovascular", level: "moderate", score: 43 },
  { key: "respiratory", level: "low", score: 12 },
  { key: "metabolic", level: "moderate", score: 39 },
  { key: "mobility", level: "low", score: 18 },
];

const levelStyles: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  moderate: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  high: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

const barColor: Record<string, string> = {
  low: "bg-emerald-500",
  moderate: "bg-amber-500",
  high: "bg-rose-500",
};

/* ===================== sub-components ===================== */

function ProgressRing({
  value,
  color,
  exportTitle,
}: {
  value: number;
  color: string;
  exportTitle?: string;
}) {
  const data = [{ name: "score", value, fill: color }];
  return (
    <div
      className="relative h-28 w-28"
      data-export-chart={exportTitle ? `system-${exportTitle}` : undefined}
      data-export-chart-title={exportTitle}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="72%"
          outerRadius="100%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
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

export function HealthKpisPanel({
  patientName: patientNameProp,
  userId: userIdProp,
  backRoute,
}: HealthKpisPanelProps = {}) {
  const { t } = useTranslation();
  const { user } = useUser();
  const data = useMemo(() => chartData, []);

  const patientName =
    patientNameProp ??
    (user ? `${user.first_name} ${user.last_name}`.trim() : undefined);
  const userId = userIdProp ?? user?.id;

  const reportData = useMemo((): HealthKpisReportData => {
    const hrStats = chartStats(data.map((d) => d.heartRate));
    const spo2Stats = chartStats(data.map((d) => d.spo2));
    const bpSysStats = chartStats(data.map((d) => d.bpSystolic));
    const tempStats = chartStats(data.map((d) => d.temperature));

    return {
      patientName,
      userId,
      generatedAt: new Date().toLocaleString(),
      heroCards: heroCards.map((card) => ({
        label: t(card.key),
        value: card.value,
        suffix: card.suffix,
        delta: card.delta,
        deltaUp: card.deltaUp,
      })),
      systemScores: systemScores.map((s) => ({
        label: t(s.key),
        value: s.value,
      })),
      riskBreakdown: riskBreakdown.map((r) => ({
        label: t(r.key),
        level: t(r.level),
        score: r.score,
      })),
      vitals: [
        {
          label: t("heart_rate", "Heart Rate"),
          unit: t("bpm", "bpm"),
          ...hrStats,
          readings: data.map((d) => ({
            time: d.time,
            display: `${d.heartRate} bpm`,
          })),
        },
        {
          label: t("spo2", "SpO2"),
          unit: "%",
          ...spo2Stats,
          readings: data.map((d) => ({
            time: d.time,
            display: `${d.spo2}%`,
          })),
        },
        {
          label: t("blood_pressure", "Blood Pressure"),
          unit: "mmHg",
          ...bpSysStats,
          readings: data.map((d) => ({
            time: d.time,
            display: `${d.bpSystolic}/${d.bpDiastolic} mmHg`,
          })),
        },
        {
          label: t("temperature", "Temperature"),
          unit: "°C",
          ...tempStats,
          readings: data.map((d) => ({
            time: d.time,
            display: `${d.temperature} °C`,
          })),
        },
      ],
    };
  }, [data, t, patientName, userId]);

  const chartTabs: { key: MetricKey; label: string; icon: typeof HeartPulse; color: string; unit: string }[] = [
    { key: "heartRate", label: t("heart_rate", "Heart Rate"), icon: HeartPulse, color: "#ef4444", unit: t("bpm", "bpm") },
    { key: "spo2", label: t("spo2", "SpO2"), icon: Droplets, color: "#3b82f6", unit: "%" },
    { key: "bloodPressure", label: t("blood_pressure", "Blood Pressure"), icon: Gauge, color: "#8b5cf6", unit: "mmHg" },
    { key: "temperature", label: t("temperature", "Temperature"), icon: Thermometer, color: "#f97316", unit: "°C" },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-col gap-6">
        {backRoute && (
          <Link
            href={backRoute}
            className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← {t('back_to_patient', 'Back to patient')}
          </Link>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <Heading
            title={
              patientName
                ? t('patient_kpi_dashboard', '{{name}} — Health KPIs', {
                    name: patientName,
                  })
                : t('kpi_dashboard')
            }
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
              <Card
                key={card.key}
                className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-center justify-between">
                    <div className={cn("rounded-xl p-2.5", card.bg)}>
                      <Icon className={cn("h-5 w-5", card.accent)} />
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        card.deltaUp
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                      )}
                    >
                      <Delta className="h-3 w-3" />
                      <span className="ltr-nums">{card.delta}</span>
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t(card.key)}
                    </p>
                    <div className="mt-0.5 flex items-baseline gap-0.5">
                      <span className="ltr-nums text-2xl font-bold">{card.value}</span>
                      <span className="text-sm text-muted-foreground">{card.suffix}</span>
                    </div>
                  </div>

                  <div
                    className="-mb-2 -mx-2 h-10"
                    data-export-chart={`hero-${card.key}`}
                    data-export-chart-title={t(card.key)}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={card.trend} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`g-${card.key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={card.color} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={card.color} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="v"
                          stroke={card.color}
                          strokeWidth={2}
                          fill={`url(#g-${card.key})`}
                        />
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
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" />
                {t("key_metrics")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 pt-2 sm:grid-cols-4">
                {systemScores.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.key}
                      className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/30 p-4"
                    >
                      <ProgressRing value={s.value} color={s.color} exportTitle={t(s.key)} />
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {t(s.key)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Risk breakdown */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldAlert className="h-5 w-5 text-primary" />
                {t("risk_breakdown")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-2">
              {riskBreakdown.map((r) => (
                <div key={r.key} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t(r.key)}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        levelStyles[r.level],
                      )}
                    >
                      {t(r.level)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", barColor[r.level])}
                      style={{ width: `${r.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Vital Signs Charts */}
        <Card className="rounded-2xl border border-border shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              {t("vital_trends", "Vital Sign Trends")}
            </CardTitle>
            <CardDescription>{t("vital_trends_desc", "Last 24-hour readings")}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <Tabs defaultValue="heartRate" className="flex w-full flex-col gap-6">
          <TabsList className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-1 rounded-full bg-muted p-1 sm:grid-cols-4 h-11">
                {chartTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.key}
                      value={tab.key}
                      className="flex items-center justify-center gap-1.5 rounded-full text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white sm:text-sm dark:data-[state=active]:bg-blue-500 h-full"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value="heartRate" forceMount className="flex flex-col gap-5 data-[state=inactive]:hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{t("heart_rate", "Heart Rate")} <span className="text-sm font-normal text-muted-foreground">({t("bpm", "bpm")})</span></CardTitle>
                  </div>
                  <TrendBadge trend={chartStats(data.map((d) => d.heartRate)).trend} />
                </div>
                <StatGrid values={data.map((d) => d.heartRate)} unit={t("bpm", "bpm")} />
                <div
                  className="h-[280px] w-full"
                  data-export-chart="vital-heartRate"
                  data-export-chart-title={t("heart_rate", "Heart Rate")}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorHeart" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
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
                <div
                  className="h-[280px] w-full"
                  data-export-chart="vital-spo2"
                  data-export-chart-title={t("spo2", "SpO2")}
                >
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

              <TabsContent value="bloodPressure" forceMount className="flex flex-col gap-5 data-[state=inactive]:hidden">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{t("blood_pressure", "Blood Pressure")} <span className="text-sm font-normal text-muted-foreground">(mmHg)</span></CardTitle>
                  <TrendBadge trend={chartStats(data.map((d) => d.bpSystolic)).trend} />
                </div>
                <StatGrid values={data.map((d) => d.bpSystolic)} unit="mmHg" />
                <div
                  className="h-[280px] w-full"
                  data-export-chart="vital-bloodPressure"
                  data-export-chart-title={t("blood_pressure", "Blood Pressure")}
                >
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
                <div
                  className="h-[280px] w-full"
                  data-export-chart="vital-temperature"
                  data-export-chart-title={t("temperature", "Temperature")}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
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
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
