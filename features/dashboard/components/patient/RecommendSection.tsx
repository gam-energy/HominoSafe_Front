import { FC } from "react";
import { AlertCircle, ClipboardList, CheckCircle, Sparkles, Activity, Wind } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* =======================
   Types
======================= */

export type Metric = {
  value: number;
  status: "normal" | "warning" | "critical";
  reference_range: string;
  recommendation: string;
  priority: "low" | "medium" | "high";
};

export type RecommendData = {
  timestamp: string; // ISO
  user_id: number;
  health_metrics: Record<string, Metric>;
  environment_metrics: Record<string, Metric>;
  general_recommendations: string[];
  alert_level_value: number;
};

export type SectionType = "daily" | "alerts" | "risk" | "kpis";

/* =======================
   Alert Meta
======================= */

const alertMeta: Record<number, {
  labelKey: string;
  defaultLabel: string;
  descriptionKey: string;
  defaultDesc: string;
  className: string;
  icon: typeof CheckCircle;
  iconColor: string;
}> = {
  0: {
    labelKey: "low_risk",
    defaultLabel: "Low Risk",
    descriptionKey: "low_risk_description",
    defaultDesc: "All monitored parameters are within safe ranges.",
    className:
      "bg-emerald-50/80 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-300",
    icon: CheckCircle,
    iconColor: "text-emerald-500",
  },
  1: {
    labelKey: "moderate_risk",
    defaultLabel: "Low Risk",
    descriptionKey: "low_risk_description",
    defaultDesc: "Minor deviations detected; continue routine monitoring.",
    className:
      "bg-emerald-50/80 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-300",
    icon: CheckCircle,
    iconColor: "text-emerald-500",
  },
  2: {
    labelKey: "moderate_risk",
    defaultLabel: "Moderate Risk",
    descriptionKey: "moderate_risk_description",
    defaultDesc: "Some parameters require closer clinical attention.",
    className:
      "bg-amber-50/80 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300",
    icon: AlertCircle,
    iconColor: "text-amber-500",
  },
  3: {
    labelKey: "high_risk",
    defaultLabel: "High Risk",
    descriptionKey: "high_risk_description",
    defaultDesc: "Immediate medical review or intervention is advised.",
    className:
      "bg-rose-50/80 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-300",
    icon: AlertCircle,
    iconColor: "text-rose-500",
  },
  4: {
    labelKey: "critical_risk",
    defaultLabel: "Critical",
    descriptionKey: "high_risk_description",
    defaultDesc: "Critical readings detected — seek immediate medical attention.",
    className:
      "bg-rose-50/80 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-300",
    icon: AlertCircle,
    iconColor: "text-rose-500",
  },
};

/* =======================
   Date Formatter
======================= */

function formatISODate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/* =======================
   Metric Row
======================= */

const statusColors: Record<Metric["status"], string> = {
  normal: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  critical: "text-rose-600 dark:text-rose-400",
};

const MetricList: FC<{
  title: string;
  metrics: Record<string, Metric>;
  icon: typeof Activity;
}> = ({ title, metrics, icon: Icon }) => {
  const entries = Object.entries(metrics || {});
  if (entries.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 pb-1">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      <div className="space-y-1.5">
        {entries.map(([key, m]) => (
          <div key={key} className="rounded-lg border bg-muted/30 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold capitalize">{key.replace(/_/g, " ")}</span>
              <span className={cn("text-sm font-bold", statusColors[m.status])}>
                {m.value} <span className="text-xs font-normal opacity-70">({m.status})</span>
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="opacity-70">Range:</span> {m.reference_range}
            </p>
            {m.recommendation && (
              <p className="mt-0.5 text-xs">{m.recommendation}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* =======================
   Component
======================= */

export const RecommendSection: FC<{
  data: RecommendData | null | undefined;
  isError?: boolean;
  activeSection: SectionType;
  onSectionChange?: (section: SectionType) => void;
}> = ({ data, isError, activeSection }) => {
  const { t } = useTranslation();

  if (isError || !data) {
    return (
      <section className="w-full max-w-full space-y-3 pt-1 pb-1">
        <div className="flex items-start gap-4 border border-dashed rounded-2xl p-4 bg-muted/20">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">{t('recommendations_unavailable', 'Recommendations unavailable')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('recommendations_unavailable_desc', 'We could not load your recommendations right now. Please try again later.')}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const alert = alertMeta[data.alert_level_value] || alertMeta[0];
  const AlertIcon = alert.icon;

  return (
    <section className="w-full max-w-full space-y-5 overflow-hidden pt-1 pb-1">
      {/* ===== Overall Health Status Card ===== */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-start gap-4 border rounded-2xl p-4 shadow-sm backdrop-blur-md transition-all duration-300",
          alert.className
        )}
      >
        <div className={cn("p-2 rounded-xl bg-background/50 dark:bg-zinc-900/50 flex-shrink-0", alert.iconColor)}>
          <AlertIcon className="w-5.5 h-5.5" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="font-bold text-sm tracking-tight">
              {t('overall_health_status', 'Overall Health Status')}: {t(alert.labelKey, alert.defaultLabel)}
            </p>
            <span className="text-xs opacity-70 font-semibold ltr-nums">
              🕒 {formatISODate(data.timestamp)}
            </span>
          </div>
          <p className="text-xs opacity-85 font-medium leading-relaxed">{t(alert.descriptionKey, alert.defaultDesc)}</p>
        </div>
      </motion.div>

      {/* ===== Metric breakdown ===== */}
      <div className="space-y-4">
        <MetricList
          title={t('health_metrics', 'Health metrics')}
          metrics={data.health_metrics}
          icon={Activity}
        />
        <MetricList
          title={t('environment_metrics', 'Environment metrics')}
          metrics={data.environment_metrics}
          icon={Wind}
        />
      </div>

      {/* ===== System Recommendations ===== */}
      {activeSection === "alerts" && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3.5"
        >
          <div className="flex items-center gap-2 pb-1">
            <ClipboardList className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
              {t('system_recommendations', 'System Recommendations')}
            </h2>
          </div>

          {(!data.general_recommendations || data.general_recommendations.length === 0) ? (
            <p className="text-sm text-gray-500 dark:text-zinc-400 italic py-8 text-center bg-muted/20 rounded-2xl border border-dashed">
              {t('no_recommendations', 'No recommendations at this time.')}
            </p>
          ) : (
            <ul className="space-y-3">
              {data.general_recommendations.map((rec, idx) => (
                <motion.li
                  initial={{ opacity: 0, x: 4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={idx}
                  className="flex items-start gap-3.5 p-4 rounded-2xl bg-primary/5 dark:bg-blue-500/5 border border-primary/10 text-xs font-semibold leading-relaxed hover:bg-primary/10 transition-colors duration-300"
                >
                  <div className="p-1 bg-primary/10 rounded-lg text-primary flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <span className="text-zinc-800 dark:text-zinc-200">
                    {rec}
                  </span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
      )}
    </section>
  );
};
