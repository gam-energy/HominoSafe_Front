"use client";

import { FC, useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Clock, ShieldAlert, Sparkles, Activity, AlertTriangle, AlertCircle, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
  recent_alerts: string[];
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
  liveData?: object;
}

export const SummarySection: FC<SummarySectionProps> = ({
  data,
  activeSection,
  liveData,
}) => {
  const syncedKpis = {
    ...data.kpis,
    heart_rate: {
      ...data.kpis["heart_rate"],
      value: (liveData as any)?.wearable?.heart_rate ?? data.kpis["heart_rate"]?.value,
    },
    bp_systolic: {
      ...data.kpis["bp_systolic"],
      value: (liveData as any)?.wearable?.bp_systolic ?? data.kpis["bp_systolic"]?.value,
    },
    bp_diastolic: {
      ...data.kpis["bp_diastolic"],
      value: (liveData as any)?.wearable?.bp_diastolic ?? data.kpis["bp_diastolic"]?.value,
    },
    spo2: { 
      ...data.kpis["spo2"], 
      value: (liveData as any)?.wearable?.spo2 ?? data.kpis["spo2"]?.value 
    },
  };

  // Build composite blood pressure KPI
  const bpKpi: KPI = {
    value: {
      systolic: syncedKpis.bp_systolic?.value,
      diastolic: syncedKpis.bp_diastolic?.value,
    } as any,
    trend: "stable",
    average_last_24h: {
      systolic: syncedKpis.bp_systolic?.average_last_24h ?? 118,
      diastolic: syncedKpis.bp_diastolic?.average_last_24h ?? 79,
    } as any,
    average_last_7d: {
      systolic: syncedKpis.bp_systolic?.average_last_7d ?? 122,
      diastolic: syncedKpis.bp_diastolic?.average_last_7d ?? 79,
    } as any,
    unit: "mmHg",
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden pt-2">
      {/* KPI Section */}
      {activeSection === "kpis" && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full"
        >
          {syncedKpis["heart_rate"] && (
            <KpiItemCard
              name="heart_rate"
              title="Heart Rate"
              kpi={syncedKpis["heart_rate"]}
              icon={Heart}
              color="text-rose-500"
              bg="bg-rose-500/10"
            />
          )}
          <KpiItemCard
            name="blood_pressure"
            title="Blood Pressure"
            kpi={bpKpi}
            icon={Activity}
            color="text-violet-500"
            bg="bg-violet-500/10"
          />
          {syncedKpis["spo2"] && (
            <KpiItemCard
              name="spo2"
              title="Oxygen (SpO2)"
              kpi={syncedKpis["spo2"]}
              icon={ShieldAlert}
              color="text-blue-500"
              bg="bg-blue-500/10"
            />
          )}
        </motion.div>
      )}

      {/* Daily Overview Section */}
      {activeSection === "daily" && (
        <motion.section 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full"
        >
          <OverviewCard
            label="Avg Heart Rate"
            value={data.daily_overview?.avg_heart_rate ?? 74}
            unit="bpm"
          />
          <OverviewCard
            label="Avg SpO2"
            value={data.daily_overview?.avg_spo2 ?? 97}
            unit="%"
          />
          <OverviewCard
            label="Max BP Systolic"
            value={data.daily_overview?.max_bp_systolic ?? 124}
            unit="mmHg"
          />
          <OverviewCard
            label="Min BP Diastolic"
            value={data.daily_overview?.min_bp_diastolic ?? 76}
            unit="mmHg"
          />
        </motion.section>
      )}

      {/* Alerts */}
      {activeSection === "alerts" && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3.5"
        >
          {(!data.recent_alerts || data.recent_alerts.length === 0) ? (
            <p className="text-gray-500 dark:text-zinc-400 text-sm italic py-8 text-center bg-muted/20 rounded-2xl border border-dashed">
              No recent alerts recorded.
            </p>
          ) : (
            <div className="space-y-3">
              {data.recent_alerts.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-amber-50/80 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl p-4 shadow-sm text-sm"
                >
                  <div className="p-1.5 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 flex-shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-amber-600/80 uppercase tracking-wider">Clinical Risk Warning</span>
                    <p className="text-zinc-800 dark:text-zinc-200 text-xs font-semibold leading-relaxed">
                      {alert}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Risk Assessment */}
      {activeSection === "risk" && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1"
        >
          {(!data.risk_assessments || data.risk_assessments.length === 0) ? (
            <div className="text-sm text-gray-500 dark:text-zinc-400 italic py-8 text-center bg-muted/20 rounded-2xl border border-dashed">
              No risk assessments available
            </div>
          ) : (
            data.risk_assessments.map((risk, i) => {
              const isHigh = risk.risk_level.toLowerCase() === "high";
              const isMedium = risk.risk_level.toLowerCase() === "medium" || risk.risk_level.toLowerCase() === "moderate";
              
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
                  className={cn("rounded-2xl border p-4 shadow-sm space-y-3 transition-transform duration-300 hover:scale-[1.01]", borderTheme)}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className={cn("p-1.5 rounded-lg bg-background border flex-shrink-0", textTheme)}>
                        <TrendingDown className="w-4 h-4" />
                      </div>
                      <span className={cn("text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider", badgeTheme)}>
                        {risk.risk_level.toUpperCase()} RISK
                      </span>
                    </div>

                    <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1 ltr-nums">
                      <Clock className="h-3.5 w-3.5" />
                      {formatISODate(risk.time)}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="text-xs space-y-2 dark:text-zinc-200">
                    <p className="leading-relaxed">
                      <span className="font-bold text-gray-800 dark:text-zinc-300 block mb-0.5">Predicted Condition</span>
                      <span className="font-semibold text-zinc-600 dark:text-zinc-400">{risk.predicted_condition}</span>
                    </p>

                    <div className="mt-3 p-3 rounded-xl bg-background/80 dark:bg-black/20 border text-xs space-y-1">
                      <span className="font-bold text-primary dark:text-blue-400 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                        Recommended Action
                      </span>
                      <p className="text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">{risk.recommendation}</p>
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

// Polished KPI Item Card
const KpiItemCard = ({ name, title, kpi, icon: Icon, color, bg }: { name: string; title: string; kpi: KPI; icon: any; color: string; bg: string }) => {
  let TrendIcon = Minus;
  let trendTheme = "text-muted-foreground bg-muted/60";

  const trendValue = typeof kpi.trend === "string" ? kpi.trend : null;

  if (trendValue !== null) {
    if (trendValue.toLowerCase().includes("increasing") || trendValue.toLowerCase().includes("rising")) {
      TrendIcon = TrendingUp;
      trendTheme = "text-rose-500 bg-rose-500/10";
    } else if (trendValue.toLowerCase().includes("decreasing") || trendValue.toLowerCase().includes("falling")) {
      TrendIcon = TrendingDown;
      trendTheme = "text-emerald-500 bg-emerald-500/10";
    }
  }

  // Display value
  const displayValue =
    name === "blood_pressure" && typeof kpi.value === "object"
      ? `${Math.round((kpi.value as any).systolic)} / ${Math.round((kpi.value as any).diastolic)}`
      : typeof kpi.value === "number"
      ? Math.round(kpi.value)
      : kpi.value;

  const displayAvg24h =
    name === "blood_pressure" && kpi.average_last_24h
      ? `${Math.round((kpi.average_last_24h as any).systolic)} / ${Math.round(
          (kpi.average_last_24h as any).diastolic
        )}`
      : roundValue(kpi.average_last_24h);

  const displayAvg7d =
    name === "blood_pressure" && kpi.average_last_7d
      ? `${Math.round((kpi.average_last_7d as any).systolic)} / ${Math.round(
          (kpi.average_last_7d as any).diastolic
        )}`
      : roundValue(kpi.average_last_7d);

  return (
    <div className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 bg-background dark:bg-zinc-900/60 shadow-sm flex flex-col transition-all duration-300 hover:shadow hover:-translate-y-0.5 group h-full">
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <div className={cn("p-2 rounded-xl transition-transform duration-300 group-hover:scale-110", color, bg)}>
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
          <span>24h Average:</span>
          <span className="text-gray-700 dark:text-zinc-300 ltr-nums">{displayAvg24h ?? "N/A"}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>7d Average:</span>
          <span className="text-gray-700 dark:text-zinc-300 ltr-nums">{displayAvg7d ?? "N/A"}</span>
        </div>
        <div className="flex justify-between items-center mt-0.5">
          <span>EHR Trend:</span>
          <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide", trendTheme)}>
            <TrendIcon className="w-3 h-3" />
            <span>{trendValue ?? "stable"}</span>
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
  value: number | null;
  unit: string;
}) => {
  return (
    <div className="bg-background dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow shadow-sm group">
      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">
        {label}
      </div>
      <div className="text-2xl font-black text-gray-900 dark:text-zinc-100 ltr-nums group-hover:scale-105 transition-transform duration-300">
        {value !== null && value !== undefined ? Math.round(value) : "N/A"}
      </div>
      <div className="text-muted-foreground text-xs font-bold mt-1 lowercase">{unit}</div>
    </div>
  );
};
