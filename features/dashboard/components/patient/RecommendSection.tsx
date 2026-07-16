import { FC } from "react";
import { AlertCircle, ClipboardList, CheckCircle, Sparkles } from "lucide-react";
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
  alert_level_value: "0" | "1" | "2";
};

export type SectionType = "daily" | "alerts" | "risk" | "kpis";

/* =======================
   Alert Meta
======================= */

const alertMeta = {
  "0": {
    labelKey: "low_risk",
    defaultLabel: "Low Risk",
    descriptionKey: "low_risk_description",
    defaultDesc: "All monitored parameters are within safe ranges.",
    className:
      "bg-emerald-50/80 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-300",
    icon: CheckCircle,
    iconColor: "text-emerald-500",
  },
  "1": {
    labelKey: "moderate_risk",
    defaultLabel: "Moderate Risk",
    descriptionKey: "moderate_risk_description",
    defaultDesc: "Some parameters require closer clinical attention.",
    className:
      "bg-amber-50/80 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300",
    icon: AlertCircle,
    iconColor: "text-amber-500",
  },
  "2": {
    labelKey: "high_risk",
    defaultLabel: "High Risk",
    descriptionKey: "high_risk_description",
    defaultDesc: "Immediate medical review or intervention is advised.",
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
   Component
======================= */

export const RecommendSection: FC<{
  data: RecommendData;
  activeSection: SectionType;
  onSectionChange?: (section: SectionType) => void;
}> = ({ data, activeSection }) => {
  const { t } = useTranslation();
  const alert = alertMeta[data.alert_level_value] || alertMeta["0"];
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
