"use client";

import React, { useMemo, useState } from "react";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import {
  HeartPulse,
  Droplets,
  Gauge,
  Thermometer,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ===================== mock data (fallback) ===================== */

const mockData = [
  { time: "08:00", heartRate: 72, spo2: 98, bpSystolic: 120, bpDiastolic: 80, temperature: 36.5 },
  { time: "09:00", heartRate: 75, spo2: 97, bpSystolic: 122, bpDiastolic: 82, temperature: 36.6 },
  { time: "10:00", heartRate: 80, spo2: 98, bpSystolic: 125, bpDiastolic: 85, temperature: 36.7 },
  { time: "11:00", heartRate: 78, spo2: 99, bpSystolic: 121, bpDiastolic: 81, temperature: 36.6 },
  { time: "12:00", heartRate: 85, spo2: 96, bpSystolic: 128, bpDiastolic: 88, temperature: 36.8 },
  { time: "13:00", heartRate: 74, spo2: 98, bpSystolic: 119, bpDiastolic: 79, temperature: 36.5 },
  { time: "14:00", heartRate: 70, spo2: 99, bpSystolic: 115, bpDiastolic: 75, temperature: 36.4 },
];

type TimePeriod = "day" | "week" | "month";
type MetricKey = "heartRate" | "spo2" | "bloodPressure" | "temperature";

/* ===================== helpers ===================== */

function stats(values: number[]) {
  if (!values.length) return { avg: 0, min: 0, max: 0, latest: 0, trend: 0 };
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  const latest = values[values.length - 1];
  const first = values[0];
  const trend = first === 0 ? 0 : ((latest - first) / first) * 100;
  return {
    avg: Math.round(avg * 10) / 10,
    min: Math.min(...values),
    max: Math.max(...values),
    latest,
    trend: Math.round(trend * 10) / 10,
  };
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.name}
          className="ltr-nums text-sm font-semibold"
          style={{ color: entry.color }}
        >
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

/* ===================== summary stat cards ===================== */

function StatGrid({
  values,
  unit,
}: {
  values: number[];
  unit: string;
}) {
  const { t } = useTranslation();
  const s = stats(values);

  const items = [
    { label: t("latest"), value: s.latest },
    { label: t("average"), value: s.avg },
    { label: t("minimum"), value: s.min },
    { label: t("maximum"), value: s.max },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border bg-muted/40 p-3 text-center"
        >
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {item.label}
          </p>
          <p className="ltr-nums mt-1 text-lg font-bold">
            {item.value}
            <span className="ms-1 text-xs font-normal text-muted-foreground">
              {unit}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}

function TrendBadge({ trend }: { trend: number }) {
  const { t } = useTranslation();
  const isFlat = Math.abs(trend) < 0.5;
  const isUp = trend > 0;
  const Icon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown;
  const label = isFlat ? t("stable") : isUp ? t("rising") : t("falling");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        isFlat
          ? "bg-muted text-muted-foreground"
          : isUp
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      {!isFlat && <span className="ltr-nums">{Math.abs(trend)}%</span>}
    </span>
  );
}

/* ===================== page ===================== */

export default function VisualizationsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<TimePeriod>("day");

  // The mock dataset is daily; week/month simply re-scale labels for now.
  const data = useMemo(() => mockData, []);

  const tabs: {
    key: MetricKey;
    label: string;
    icon: typeof HeartPulse;
    color: string;
    unit: string;
  }[] = [
    { key: "heartRate", label: t("heart_rate"), icon: HeartPulse, color: "#ef4444", unit: t("bpm") },
    { key: "spo2", label: t("spo2"), icon: Droplets, color: "#3b82f6", unit: "%" },
    { key: "bloodPressure", label: t("blood_pressure"), icon: Gauge, color: "#8b5cf6", unit: "mmHg" },
    { key: "temperature", label: t("temperature"), icon: Thermometer, color: "#f97316", unit: "°C" },
  ];

  const periodOptions: { value: TimePeriod; label: string }[] = [
    { value: "day", label: t("last_day") },
    { value: "week", label: t("last_week") },
    { value: "month", label: t("last_month") },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Heading
            title={t("visualizations")}
            description={t("visualizations_description")}
          />
          <div className="flex items-center gap-1 rounded-full bg-muted p-1">
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                  period === opt.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Card className="rounded-2xl border border-border shadow-md">
          <CardContent className="p-4 sm:p-6">
            <Tabs defaultValue="heartRate" className="flex w-full flex-col gap-6">
              <TabsList className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-1 rounded-full bg-muted p-1 sm:grid-cols-4">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.key}
                      value={tab.key}
                      className="flex items-center gap-1.5 rounded-full py-2 text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white sm:text-sm dark:data-[state=active]:bg-blue-500"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="truncate">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* Heart Rate */}
              <TabsContent value="heartRate" className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {t("heart_rate")}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        ({t("bpm")})
                      </span>
                    </CardTitle>
                    <CardDescription>{t("heart_rate_trend")}</CardDescription>
                  </div>
                  <TrendBadge trend={stats(data.map((d) => d.heartRate)).trend} />
                </div>
                <StatGrid values={data.map((d) => d.heartRate)} unit={t("bpm")} />
                <div className="h-[300px] w-full">
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
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="heartRate" name={t("heart_rate")} stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorHeart)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              {/* SpO2 */}
              <TabsContent value="spo2" className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {t("spo2")}{" "}
                      <span className="text-sm font-normal text-muted-foreground">(%)</span>
                    </CardTitle>
                    <CardDescription>{t("spo2_description")}</CardDescription>
                  </div>
                  <TrendBadge trend={stats(data.map((d) => d.spo2)).trend} />
                </div>
                <StatGrid values={data.map((d) => d.spo2)} unit="%" />
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[90, 100]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line type="monotone" dataKey="spo2" name={t("spo2")} stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              {/* Blood Pressure */}
              <TabsContent value="bloodPressure" className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {t("blood_pressure")}{" "}
                      <span className="text-sm font-normal text-muted-foreground">(mmHg)</span>
                    </CardTitle>
                    <CardDescription>{t("bp_description")}</CardDescription>
                  </div>
                  <TrendBadge trend={stats(data.map((d) => d.bpSystolic)).trend} />
                </div>
                <StatGrid values={data.map((d) => d.bpSystolic)} unit="mmHg" />
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis domain={["dataMin - 10", "dataMax + 10"]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="bpSystolic" name={t("systolic")} stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="bpDiastolic" name={t("diastolic")} stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              {/* Temperature */}
              <TabsContent value="temperature" className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {t("temperature")}{" "}
                      <span className="text-sm font-normal text-muted-foreground">(°C)</span>
                    </CardTitle>
                    <CardDescription>{t("trends")}</CardDescription>
                  </div>
                  <TrendBadge trend={stats(data.map((d) => d.temperature)).trend} />
                </div>
                <StatGrid values={data.map((d) => d.temperature)} unit="°C" />
                <div className="h-[300px] w-full">
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
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="temperature" name={t("temperature")} stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
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
