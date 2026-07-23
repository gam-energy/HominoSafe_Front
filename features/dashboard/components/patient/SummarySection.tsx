"use client";

import { FC } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  ShieldAlert,
  Sparkles,
  Activity,
  AlertTriangle,
  Heart,
  Thermometer,
  Footprints,
  Droplets,
  Wind,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { DashboardData } from "@/features/dashboard/types/patient/overview";
import type { RecentAlert } from "@/features/dashboard/types/patient/summery";

export type KPI = {
  value: number;
  trend: string | number | null;
  average_last_24h: number | null;
  average_last_7d: number | null;
  unit: string;
};

type RiskAssessment = {
  time: string;
  risk_level: string;
  predicted_condition: string;
  recommendation: string;
};

export type SummaryData = {
  user_id: number;
  last_updated: string;
  kpis: Record<string, KPI>;
  recent_alerts: RecentAlert[];
  risk_assessments: RiskAssessment[];
  daily_overview: {
    date: string;
    avg_heart_rate: number | null;
    avg_spo2: number | null;
    max_bp_systolic: number | null;
    min_bp_diastolic: number | null;
  };
};

export function formatISODate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export type SectionType = "kpis" | "daily" | "alerts" | "risk";

interface SummarySectionProps {
  data: SummaryData;
  activeSection: SectionType;
  onSectionChange?: (section: SectionType) => void;
  liveData?: DashboardData;
  /** When true, show KPIs + daily stats + alerts together (Daily Overview tab). */
  layout?: "full" | "section";
}

function useSyncedKpis(data: SummaryData, liveData?: DashboardData) {
  const wearable = liveData?.wearable;
  const environmental = liveData?.environmental;

  // Prefer body (wearable) temperature for the Temperature card — do not mix
  // watch live values into ambient environmental averages/trends.
  const bodyTempKpi = data.kpis["body_temperature"] ?? {
    value: null as unknown as number,
    trend: "stable",
    average_last_24h: null,
    average_last_7d: null,
    unit: "°C",
  };

  return {
    ...data.kpis,
    heart_rate: {
      ...data.kpis["heart_rate"],
      value: wearable?.heart_rate ?? data.kpis["heart_rate"]?.value,
    },
    bp_systolic: {
      ...data.kpis["bp_systolic"],
      value: wearable?.bp_systolic ?? data.kpis["bp_systolic"]?.value,
    },
    bp_diastolic: {
      ...data.kpis["bp_diastolic"],
      value: wearable?.bp_diastolic ?? data.kpis["bp_diastolic"]?.value,
    },
    spo2: {
      ...data.kpis["spo2"],
      value: wearable?.spo2 ?? data.kpis["spo2"]?.value,
    },
    body_temperature: {
      ...bodyTempKpi,
      value: wearable?.temperature ?? bodyTempKpi?.value,
    },
    // Ambient room temperature (env sensor) — kept separate from body temp.
    temperature: {
      ...data.kpis["temperature"],
      value: environmental?.temperature ?? data.kpis["temperature"]?.value,
    },
    humidity: {
      ...data.kpis["humidity"],
      value: environmental?.humidity ?? data.kpis["humidity"]?.value,
    },
    CO2: {
      ...data.kpis["CO2"],
      value: environmental?.CO2 ?? data.kpis["CO2"]?.value,
    },
  };
}

/** Collapse near-duplicate alerts (same type + message within a short window). */
function dedupeRecentAlerts(alerts: RecentAlert[], windowMs = 15 * 60 * 1000): RecentAlert[] {
  const out: RecentAlert[] = [];
  for (const alert of alerts) {
    const prev = out[out.length - 1];
    if (
      prev &&
      prev.alert_type === alert.alert_type &&
      prev.message === alert.message &&
      prev.time &&
      alert.time
    ) {
      const dt = Math.abs(new Date(prev.time).getTime() - new Date(alert.time).getTime());
      if (Number.isFinite(dt) && dt <= windowMs) continue;
    }
    out.push(alert);
  }
  return out;
}

function formatTrendLabel(trend: string | null | undefined): string {
  if (!trend) return "Stable";
  const key = trend.toLowerCase().replace(/-/g, "_");
  if (key === "not_enough_data" || key === "insufficient_data") return "Limited data";
  if (key.includes("increasing") || key.includes("rising")) return "Rising";
  if (key.includes("decreasing") || key.includes("falling")) return "Falling";
  if (key.includes("stable")) return "Stable";
  return trend.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildBpKpi(syncedKpis: ReturnType<typeof useSyncedKpis>): KPI {
  return {
    value: {
      systolic: syncedKpis.bp_systolic?.value,
      diastolic: syncedKpis.bp_diastolic?.value,
    } as unknown as number,
    trend: syncedKpis.bp_systolic?.trend ?? "stable",
    average_last_24h: {
      systolic: syncedKpis.bp_systolic?.average_last_24h,
      diastolic: syncedKpis.bp_diastolic?.average_last_24h,
    } as unknown as number,
    average_last_7d: {
      systolic: syncedKpis.bp_systolic?.average_last_7d,
      diastolic: syncedKpis.bp_diastolic?.average_last_7d,
    } as unknown as number,
    unit: "mmHg",
  };
}

export const SummarySection: FC<SummarySectionProps> = ({
  data,
  activeSection,
  liveData,
  layout = "section",
}) => {
  const { t } = useTranslation();
  const syncedKpis = useSyncedKpis(data, liveData);
  const bpKpi = buildBpKpi(syncedKpis);
  const activity = liveData?.wearable?.activity;

  const showKpis = layout === "full" || activeSection === "kpis";
  const showDaily = layout === "full" || activeSection === "daily";
  const showAlerts = layout === "full" || activeSection === "alerts";
  const showRisk = activeSection === "risk";

  const kpiCards = [
    syncedKpis.heart_rate?.value != null && {
      name: "heart_rate",
      title: t("heart_rate", "Heart Rate"),
      kpi: syncedKpis.heart_rate,
      icon: Heart,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    (syncedKpis.bp_systolic?.value != null || syncedKpis.bp_diastolic?.value != null) && {
      name: "blood_pressure",
      title: t("blood_pressure", "Blood Pressure"),
      kpi: bpKpi,
      icon: Activity,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    syncedKpis.spo2?.value != null && {
      name: "spo2",
      title: t("spo2", "Oxygen (SpO2)"),
      kpi: syncedKpis.spo2,
      icon: ShieldAlert,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    syncedKpis.body_temperature?.value != null && {
      name: "body_temperature",
      title: t("body_temperature", "Body Temperature"),
      kpi: syncedKpis.body_temperature,
      icon: Thermometer,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    syncedKpis.humidity?.value != null && {
      name: "humidity",
      title: t("humidity", "Humidity"),
      kpi: syncedKpis.humidity,
      icon: Droplets,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
    syncedKpis.CO2?.value != null && {
      name: "CO2",
      title: t("co2", "CO₂"),
      kpi: syncedKpis.CO2,
      icon: Wind,
      color: "text-slate-500",
      bg: "bg-slate-500/10",
    },
  ].filter(Boolean) as Array<{
    name: string;
    title: string;
    kpi: KPI;
    icon: typeof Heart;
    color: string;
    bg: string;
  }>;

  return (
    <div className="w-full max-w-full space-y-5 overflow-hidden pt-1">
      {layout === "full" && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {t("last_updated", "Last updated")}:{" "}
            <span className="text-foreground ltr-nums">
              {formatISODate(data.last_updated)}
            </span>
          </div>
          {activity && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <Footprints className="h-3.5 w-3.5" />
              {activity}
            </div>
          )}
        </div>
      )}

      {showKpis && (
        <section className="space-y-3">
          {layout === "full" && (
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              {t("live_vitals", "Live Vitals")}
            </h3>
          )}
          {kpiCards.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-6 text-center bg-muted/20 rounded-2xl border border-dashed">
              {t(
                "no_vitals_yet",
                "No vitals yet. Connect your smart watch to start streaming data."
              )}
            </p>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full"
            >
              {kpiCards.map((card) => (
                <KpiItemCard key={card.name} {...card} />
              ))}
            </motion.div>
          )}
        </section>
      )}

      {showDaily && (
        <section className="space-y-3">
          {layout === "full" && (
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              {t("today_summary", "Today's Summary")}
              {data.daily_overview?.date && (
                <span className="ms-2 font-normal normal-case text-muted-foreground/80">
                  ({data.daily_overview.date})
                </span>
              )}
            </h3>
          )}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full"
          >
            <OverviewCard
              label={t("avg_heart_rate", "Avg Heart Rate")}
              value={data.daily_overview?.avg_heart_rate}
              unit="bpm"
            />
            <OverviewCard
              label={t("avg_spo2", "Avg SpO2")}
              value={data.daily_overview?.avg_spo2}
              unit="%"
            />
            <OverviewCard
              label={t("max_bp_systolic", "Max BP Systolic")}
              value={data.daily_overview?.max_bp_systolic}
              unit="mmHg"
            />
            <OverviewCard
              label={t("min_bp_diastolic", "Min BP Diastolic")}
              value={data.daily_overview?.min_bp_diastolic}
              unit="mmHg"
            />
          </motion.div>
        </section>
      )}

      {showAlerts && (
        <section className="space-y-3">
          {layout === "full" && (
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              {t("recent_alerts", "Recent Alerts")}
            </h3>
          )}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3.5"
          >
            {!(data.recent_alerts?.length) ? (
              <p className="text-gray-500 dark:text-zinc-400 text-sm italic py-6 text-center bg-muted/20 rounded-2xl border border-dashed">
                {t("no_recent_alerts", "No recent alerts recorded.")}
              </p>
            ) : (
              <div className="space-y-3">
                {dedupeRecentAlerts(data.recent_alerts)
                  .slice(0, layout === "full" ? 5 : undefined)
                  .map((alert) => (
                  <div
                    key={String(alert.id ?? `${alert.alert_type}-${alert.time}-${alert.message}`)}
                    className="flex items-start gap-3 bg-amber-50/80 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl p-4 shadow-sm text-sm"
                  >
                    <div className="p-1.5 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 flex-shrink-0">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-amber-600/80 uppercase tracking-wider">
                          {alert.alert_type
                            ? alert.alert_type.replace(/_/g, ' ')
                            : t("clinical_warning", "Clinical Warning")}
                        </span>
                        {alert.severity && (
                          <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                            {alert.severity}
                          </span>
                        )}
                        {alert.time && (
                          <span className="text-[10px] text-muted-foreground ltr-nums ms-auto">
                            {formatISODate(alert.time)}
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-800 dark:text-zinc-200 text-xs font-semibold leading-relaxed">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </section>
      )}

      {showRisk && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3.5 pb-10"
        >
          {!data.risk_assessments?.length ? (
            <div className="text-sm text-gray-500 dark:text-zinc-400 italic py-8 text-center bg-muted/20 rounded-2xl border border-dashed">
              {t("no_risk_assessments", "No risk assessments available")}
            </div>
          ) : (
            data.risk_assessments.map((risk, i) => {
              const level = risk.risk_level.toLowerCase();
              const isHigh = level === "high";
              const isMedium = level === "medium" || level === "moderate";

              const borderTheme = isHigh
                ? "border-rose-200/50 dark:border-rose-900/30 bg-rose-50/80 dark:bg-rose-950/10"
                : isMedium
                  ? "border-amber-200/50 dark:border-amber-900/30 bg-amber-50/80 dark:bg-amber-950/10"
                  : "border-emerald-200/50 dark:border-emerald-900/30 bg-emerald-50/80 dark:bg-emerald-950/10";

              const textTheme = isHigh
                ? "text-rose-700 dark:text-rose-300"
                : isMedium
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-emerald-700 dark:text-emerald-300";

              const badgeTheme = isHigh
                ? "bg-rose-500 text-white"
                : isMedium
                  ? "bg-amber-500 text-white"
                  : "bg-emerald-500 text-white";

              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-2xl border p-4 shadow-sm space-y-3 transition-transform duration-300 hover:scale-[1.01]",
                    borderTheme
                  )}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "p-1.5 rounded-lg bg-background border flex-shrink-0",
                          textTheme
                        )}
                      >
                        <TrendingDown className="w-4 h-4" />
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider",
                          badgeTheme
                        )}
                      >
                        {risk.risk_level.toUpperCase()} {t("risk", "RISK")}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1 ltr-nums">
                      <Clock className="h-3.5 w-3.5" />
                      {formatISODate(risk.time)}
                    </span>
                  </div>
                  <div className="text-xs space-y-2 dark:text-zinc-200">
                    <p className="leading-relaxed">
                      <span className="font-bold text-gray-800 dark:text-zinc-300 block mb-0.5">
                        {t("predicted_condition", "Predicted Condition")}
                      </span>
                      <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                        {risk.predicted_condition}
                      </span>
                    </p>
                    <div className="mt-3 p-3 rounded-xl bg-background/80 dark:bg-black/20 border text-xs space-y-1">
                      <span className="font-bold text-primary dark:text-blue-400 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                        {t("recommended_action", "Recommended Action")}
                      </span>
                      <p className="text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
                        {risk.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </motion.div>
      )}
    </div>
  );
};

const roundValue = (val: number | null | undefined): number | string => {
  if (val === null || val === undefined) return "N/A";
  return Math.round(val);
};

const KpiItemCard = ({
  name,
  title,
  kpi,
  icon: Icon,
  color,
  bg,
}: {
  name: string;
  title: string;
  kpi: KPI;
  icon: typeof Heart;
  color: string;
  bg: string;
}) => {
  let TrendIcon = Minus;
  let trendTheme = "text-muted-foreground bg-muted/60";

  const rawTrend = typeof kpi.trend === "string" ? kpi.trend : null;
  const trendKey = (rawTrend ?? "").toLowerCase().replace(/-/g, "_");
  const isLimited =
    trendKey === "not_enough_data" || trendKey === "insufficient_data";
  const trendLabel = formatTrendLabel(rawTrend);

  if (!isLimited && rawTrend) {
    if (
      trendKey.includes("increasing") ||
      trendKey.includes("rising")
    ) {
      TrendIcon = TrendingUp;
      trendTheme = "text-rose-500 bg-rose-500/10";
    } else if (
      trendKey.includes("decreasing") ||
      trendKey.includes("falling")
    ) {
      TrendIcon = TrendingDown;
      trendTheme = "text-emerald-500 bg-emerald-500/10";
    } else if (trendKey.includes("stable")) {
      trendTheme = "text-sky-600 bg-sky-500/10 dark:text-sky-400";
    }
  }

  const displayValue =
    name === "blood_pressure" && typeof kpi.value === "object"
      ? `${Math.round((kpi.value as { systolic?: number }).systolic ?? 0)} / ${Math.round((kpi.value as { diastolic?: number }).diastolic ?? 0)}`
      : typeof kpi.value === "number"
        ? Number(kpi.value).toFixed(1)
        : kpi.value;

  const displayAvg24h =
    name === "blood_pressure" && kpi.average_last_24h
      ? `${Math.round((kpi.average_last_24h as { systolic?: number }).systolic ?? 0)} / ${Math.round((kpi.average_last_24h as { diastolic?: number }).diastolic ?? 0)}`
      : roundValue(kpi.average_last_24h as number);

  const displayAvg7d =
    name === "blood_pressure" && kpi.average_last_7d
      ? `${Math.round((kpi.average_last_7d as { systolic?: number }).systolic ?? 0)} / ${Math.round((kpi.average_last_7d as { diastolic?: number }).diastolic ?? 0)}`
      : roundValue(kpi.average_last_7d as number);

  // Prefer 24h; if missing, fall back to 7d so cards don't look broken.
  const avg24hLabel =
    displayAvg24h === "N/A" && displayAvg7d !== "N/A" ? displayAvg7d : displayAvg24h;
  const avg24hHint =
    displayAvg24h === "N/A" && displayAvg7d !== "N/A" ? " (7d)" : "";

  return (
    <div className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 bg-background dark:bg-zinc-900/60 shadow-sm flex flex-col transition-all duration-300 hover:shadow hover:-translate-y-0.5 group h-full">
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <div
          className={cn(
            "p-2 rounded-xl transition-transform duration-300 group-hover:scale-110",
            color,
            bg
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-black tracking-tight flex items-baseline gap-1.5 text-gray-900 dark:text-zinc-100 ltr-nums">
        {displayValue}{" "}
        <span className="text-xs font-semibold text-muted-foreground lowercase">
          {kpi.unit}
        </span>
      </div>
      <div className="mt-4 pt-3 border-t border-dashed border-zinc-100 dark:border-zinc-800 flex flex-col gap-2 text-xs text-muted-foreground font-semibold">
        <div className="flex justify-between items-center">
          <span>24h Average{avg24hHint}:</span>
          <span className="text-gray-700 dark:text-zinc-300 ltr-nums">
            {avg24hLabel}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>7d Average:</span>
          <span className="text-gray-700 dark:text-zinc-300 ltr-nums">
            {displayAvg7d}
          </span>
        </div>
        <div className="flex justify-between items-center mt-0.5">
          <span>Trend:</span>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide",
              trendTheme
            )}
          >
            <TrendIcon className="w-3 h-3" />
            <span>{trendLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const OverviewCard = ({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null | undefined;
  unit: string;
}) => (
  <div className="bg-background dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow shadow-sm group min-h-[100px]">
    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">
      {label}
    </div>
    <div className="text-2xl font-black text-gray-900 dark:text-zinc-100 ltr-nums group-hover:scale-105 transition-transform duration-300">
      {value != null ? Math.round(value) : "—"}
    </div>
    <div className="text-muted-foreground text-xs font-bold mt-1 lowercase">{unit}</div>
  </div>
);
