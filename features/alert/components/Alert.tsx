'use client';

import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AlertType } from "../types/AlertSchema";
import { useAlertWebSocket } from "../hooks/useAlertWebSocket";
import { actOnAlert } from "../api/alertApi";
import { mapBackendAlert, compareAlertsBySeverityThenTime } from "../lib/alertTypeMap";
import { useRespondToDoseByAlert } from "@/features/medicine/api/useDoseRespond";
import { motion, AnimatePresence } from "framer-motion";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { cn } from "@/lib/utils";
import {
  Heart,
  Activity,
  Thermometer,
  Droplets,
  Brain,
  UserCheck,
  Clock,
  ChevronDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Info,
  Calendar,
  Sparkles,
} from "lucide-react";

const severityConfig: Record<
  AlertType["severity"],
  { 
    labelKey: string; 
    defaultLabel: string;
    border: string; 
    bg: string; 
    text: string; 
    iconColor: string;
    badgeBg: string;
    gradient: string;
    glow: string;
  }
> = {
  critical: { 
    labelKey: "critical", 
    defaultLabel: "Critical",
    border: "border-rose-500 dark:border-rose-600", 
    bg: "bg-rose-50/80 dark:bg-rose-950/20", 
    text: "text-rose-700 dark:text-rose-300",
    iconColor: "text-rose-500",
    badgeBg: "bg-rose-500",
    gradient: "from-rose-500/10 to-transparent",
    glow: "shadow-rose-500/10"
  },
  high: { 
    labelKey: "high", 
    defaultLabel: "High",
    border: "border-amber-500 dark:border-amber-600", 
    bg: "bg-amber-50/80 dark:bg-amber-950/20", 
    text: "text-amber-700 dark:text-amber-300",
    iconColor: "text-amber-500",
    badgeBg: "bg-amber-500",
    gradient: "from-amber-500/10 to-transparent",
    glow: "shadow-amber-500/10"
  },
  medium: { 
    labelKey: "medium", 
    defaultLabel: "Medium",
    border: "border-sky-500 dark:border-sky-600", 
    bg: "bg-sky-50/80 dark:bg-sky-950/20", 
    text: "text-sky-700 dark:text-sky-300",
    iconColor: "text-sky-500",
    badgeBg: "bg-sky-500",
    gradient: "from-sky-500/10 to-transparent",
    glow: "shadow-sky-500/10"
  },
  low: { 
    labelKey: "low", 
    defaultLabel: "Low",
    border: "border-emerald-500 dark:border-emerald-600", 
    bg: "bg-emerald-50/80 dark:bg-emerald-950/20", 
    text: "text-emerald-700 dark:text-emerald-300",
    iconColor: "text-emerald-500",
    badgeBg: "bg-emerald-500",
    gradient: "from-emerald-500/10 to-transparent",
    glow: "shadow-emerald-500/10"
  },
};

const alertTypeLabels: Record<string, { en: string; fa: string }> = {
  FALL_DETECTED: { en: "Fall Detected", fa: "سقوط شناسایی شده" },
  PREDICTED_ORTHOSTATIC_HYPOTENSION: { en: "Predicted Orthostatic Hypotension", fa: "پیش‌بینی افت فشار ارتواستاتیک" },
  HR_SPIKE: { en: "Heart Rate Spike", fa: "افزایش شدید ضربان قلب" },
  OXYGEN_LOW: { en: "Low Oxygen Saturation", fa: "کاهش اکسیژن خون" },
  TEMP_HIGH: { en: "High Body Temperature", fa: "دمای بالای بدن" },
  BP_DROP: { en: "Blood Pressure Drop", fa: "افت فشار خون" },
  MEDICATION_REMINDER: { en: "Medication Reminder", fa: "یادآور دارو" },
  OTHER: { en: "Alert", fa: "هشدار" }
};

export const AlertCard: React.FC<{ alert: AlertType; onAcknowledge?: (alert: AlertType) => void }> = ({ alert, onAcknowledge }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [acking, setAcking] = useState(false);
  const [doseOutcome, setDoseOutcome] = useState<"taken" | "late" | "missed" | null>(null);
  const doseMutation = useRespondToDoseByAlert();
  const isRtl = (i18n.language || 'en').startsWith('fa');
  const isMedReminder = alert.alertType === "MEDICATION_REMINDER";
  
  const config = severityConfig[alert.severity];
  const typeLabel = alertTypeLabels[alert.alertType] 
    ? (isRtl ? alertTypeLabels[alert.alertType].fa : alertTypeLabels[alert.alertType].en)
    : alert.alertType.replace(/_/g, " ");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={cn(
        "group relative mb-4 w-full overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:shadow-md",
        isOpen ? "ring-1 ring-primary/10" : ""
      )}
    >
      {/* Accent Gradient Border */}
      <div className={cn("absolute inset-y-0 w-1.5", isRtl ? "right-0" : "left-0", config.badgeBg)} />

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 text-start focus:outline-none gap-4"
      >
        <div className={cn("flex items-center gap-3.5", isRtl ? "pr-2" : "pl-2")}>
          <div className={cn(
            "p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110",
            alert.severity === "critical" ? "animate-pulse" : "",
            config.bg,
            config.iconColor
          )}>
            {alert.severity === "critical" ? (
              <AlertTriangle className="h-5 w-5" />
            ) : alert.severity === "high" ? (
              <ShieldAlert className="h-5 w-5" />
            ) : alert.severity === "medium" ? (
              <Activity className="h-5 w-5" />
            ) : (
              <Info className="h-5 w-5" />
            )}
          </div>
          
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase ltr-nums">
              {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 flex flex-wrap items-center gap-2">
              {typeLabel}
              {alert.patientName ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold normal-case tracking-normal text-muted-foreground">
                  <UserCheck className="h-3 w-3" />
                  {alert.patientName}
                </span>
              ) : null}
            </h3>
          </div>
        </div>

        <div className={cn("flex items-center gap-3.5 self-stretch sm:self-auto justify-between sm:justify-end", isRtl ? "pl-2" : "pr-2")}>
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider",
            config.badgeBg
          )}>
            {t(config.labelKey, config.defaultLabel)}
          </span>

          <div className="flex items-center gap-3">
            {alert.isAcknowledged ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t('acknowledged', 'Acknowledged')}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded-full">
                <Clock className="h-3.5 w-3.5 animate-pulse" />
                {t('pending', 'Pending')}
              </span>
            )}

            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-muted-foreground p-1.5 hover:bg-muted rounded-full"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </div>
        </div>
      </button>

      {alert.sensorData ? (
        <div
          className={cn(
            "flex flex-wrap gap-2 border-t border-border/60 px-5 py-2.5 text-xs text-muted-foreground",
            isRtl ? "pr-7" : "pl-7"
          )}
        >
          {alert.sensorData.heartRate != null ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 font-medium ltr-nums">
              <Heart className="h-3 w-3 text-rose-500" />
              {alert.sensorData.heartRate} bpm
            </span>
          ) : null}
          {alert.sensorData.bp?.systolic != null || alert.sensorData.bp?.diastolic != null ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 font-medium ltr-nums">
              <Activity className="h-3 w-3 text-violet-500" />
              {alert.sensorData.bp?.systolic ?? '—'}/{alert.sensorData.bp?.diastolic ?? '—'} mmHg
            </span>
          ) : null}
          {alert.sensorData.spo2 != null ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 font-medium ltr-nums">
              <Droplets className="h-3 w-3 text-blue-500" />
              SpO₂ {alert.sensorData.spo2}%
            </span>
          ) : null}
          {alert.sensorData.temperature != null ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 font-medium ltr-nums">
              <Thermometer className="h-3 w-3 text-orange-500" />
              {alert.sensorData.temperature}°C
            </span>
          ) : null}
          {alert.sensorData.activity ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 font-medium">
              {alert.sensorData.activity}
            </span>
          ) : null}
        </div>
      ) : null}

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="overflow-hidden"
          >
            <div className={cn(
              "px-6 pb-6 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-sm space-y-6",
              isRtl ? "pr-8" : "pl-8"
            )}>
              {/* Grid of details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Event Metadata */}
                <div className="bg-muted/40 dark:bg-zinc-800/20 rounded-xl p-4 space-y-3.5 border border-muted/30">
                  <h4 className="font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5 border-b pb-2 border-zinc-100 dark:border-zinc-800">
                    <Calendar className="h-4 w-4 text-primary" />
                    {t('event_details', 'Event Details')}
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-medium">{t('alert_time', 'Alert Time')}:</span>
                      <span className="font-semibold text-gray-800 dark:text-zinc-200 ltr-nums">
                        {new Date(alert.timestamp).toLocaleString(i18n.language)}
                      </span>
                    </div>
                    {alert.predictedAt && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-violet-500 animate-pulse" />
                          {t('predicted_time', 'Predicted Time')}:
                        </span>
                        <span className="font-semibold text-violet-600 dark:text-violet-400 ltr-nums">
                          {new Date(alert.predictedAt).toLocaleString(i18n.language)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-medium">{t('status', 'Status')}:</span>
                      <span className="font-semibold text-gray-800 dark:text-zinc-200">
                        {alert.isAcknowledged 
                          ? `${t('acknowledged_by', 'Acknowledged by')} ${alert.acknowledgedBy || t('doctor', 'Doctor')}` 
                          : t('pending_review', 'Pending Review')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Patient Vitals at time of event */}
                <div className="bg-muted/40 dark:bg-zinc-800/20 rounded-xl p-4 border border-muted/30">
                  <h4 className="font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5 border-b pb-2 border-zinc-100 dark:border-zinc-800 mb-3.5">
                    <Heart className="h-4 w-4 text-rose-500" />
                    {t('vitals_recorded', 'Vitals Recorded')}
                  </h4>

                  {alert.sensorData ? (
                    <div className="grid grid-cols-2 gap-3.5">
                      {alert.sensorData.heartRate != null && (
                        <div className="flex items-center gap-2.5 bg-background dark:bg-zinc-900/60 p-2.5 rounded-lg border">
                          <Heart className="h-4 w-4 text-rose-500" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase">{t('heart_rate', 'HR')}</p>
                            <p className="font-bold text-sm ltr-nums">{alert.sensorData.heartRate} <span className="text-[10px] font-normal text-muted-foreground">bpm</span></p>
                          </div>
                        </div>
                      )}
                      {(alert.sensorData.bp?.systolic != null || alert.sensorData.bp?.diastolic != null) && (
                        <div className="flex items-center gap-2.5 bg-background dark:bg-zinc-900/60 p-2.5 rounded-lg border">
                          <Activity className="h-4 w-4 text-violet-500" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase">{t('blood_pressure', 'BP')}</p>
                            <p className="font-bold text-sm ltr-nums">{alert.sensorData.bp?.systolic ?? '—'}/{alert.sensorData.bp?.diastolic ?? '—'} <span className="text-[10px] font-normal text-muted-foreground">mmHg</span></p>
                          </div>
                        </div>
                      )}
                      {alert.sensorData.spo2 != null && (
                        <div className="flex items-center gap-2.5 bg-background dark:bg-zinc-900/60 p-2.5 rounded-lg border">
                          <Droplets className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase">SpO₂</p>
                            <p className="font-bold text-sm ltr-nums">{alert.sensorData.spo2} <span className="text-[10px] font-normal text-muted-foreground">%</span></p>
                          </div>
                        </div>
                      )}
                      {alert.sensorData.temperature != null && (
                        <div className="flex items-center gap-2.5 bg-background dark:bg-zinc-900/60 p-2.5 rounded-lg border">
                          <Thermometer className="h-4 w-4 text-orange-500" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase">{t('temperature', 'Temp')}</p>
                            <p className="font-bold text-sm ltr-nums">{alert.sensorData.temperature} <span className="text-[10px] font-normal text-muted-foreground">°C</span></p>
                          </div>
                        </div>
                      )}
                      {alert.sensorData.activity ? (
                        <div className="flex items-center gap-2.5 bg-background dark:bg-zinc-900/60 p-2.5 rounded-lg border col-span-2">
                          <UserCheck className="h-4 w-4 text-sky-500" />
                          <div>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase">{t('activity', 'Activity')}</p>
                            <p className="font-bold text-sm">{alert.sensorData.activity}</p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {t('no_vitals_for_alert', 'No wearable vitals available near this alert time.')}
                    </p>
                  )}
                </div>
              </div>

              {/* AI Explainability & SHAP Values Visualization */}
              {alert.aiModelOutput && (
                <div className="bg-primary/5 dark:bg-blue-950/10 rounded-xl p-4 border border-primary/10">
                  <h4 className="font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5 border-b pb-2 border-zinc-100 dark:border-zinc-800 mb-3">
                    <Brain className="h-4 w-4 text-primary animate-pulse" />
                    {t('ai_insight_explainability', 'AI Predictive Insight & Explanation')}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    {alert.aiModelOutput.explanation}
                  </p>

                  {/* SHAP Progress Bars */}
                  {alert.aiModelOutput.shapValues && (
                    <div className="space-y-3 pt-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                        <Activity className="h-3 w-3 text-primary" />
                        {t('risk_factor_contributions', 'Risk Factor Contributions (SHAP Values)')}
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(alert.aiModelOutput.shapValues).map(([key, val]) => {
                          const isPositive = val > 0;
                          const percent = Math.min(Math.abs(val) * 100, 100);
                          const formattedKey = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                          
                          return (
                            <div key={key} className="space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-medium text-gray-700 dark:text-zinc-300 truncate max-w-[200px]" title={formattedKey}>
                                  {formattedKey}
                                </span>
                                <span className={cn(
                                  "font-bold ltr-nums",
                                  isPositive ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                                )}>
                                  {isPositive ? "+" : ""}{val.toFixed(2)}
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-muted/60 relative overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percent}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                  className={cn(
                                    "absolute h-full rounded-full",
                                    isPositive 
                                      ? "bg-gradient-to-r from-rose-400 to-rose-600 right-0" 
                                      : "bg-gradient-to-r from-emerald-400 to-emerald-600 left-0"
                                  )}
                                  style={{
                                    [isPositive ? 'right' : 'left']: 0,
                                    width: `${percent}%`
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Fall camera frame (camera or watch source) */}
              {alert.vision?.frameUrl && (
                <div className="bg-muted/40 dark:bg-zinc-800/20 rounded-xl p-4 border border-muted/30">
                  <h4 className="font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5 border-b pb-2 border-zinc-100 dark:border-zinc-800 mb-3">
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                    {t('fall_frame', 'Fall Frame')} ({alert.vision.source})
                  </h4>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={alert.vision.frameUrl}
                    alt="fall frame"
                    className="w-full max-h-64 object-contain rounded-lg border"
                  />
                </div>
              )}

              {/* Notes */}
              {alert.notes && (
                <div className="bg-amber-50/50 dark:bg-amber-950/10 rounded-xl p-4 border border-amber-200/50 dark:border-amber-900/30">
                  <h4 className="font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5 border-b pb-2 border-zinc-200/50 dark:border-zinc-800 mb-2">
                    <UserCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    {t('action_notes', 'Clinical Log & Notes')}
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed italic">
                    "{alert.notes}"
                  </p>
                </div>
              )}

              {/* Medication reminder: Taken / Didn't take */}
              {isMedReminder && !alert.isAcknowledged && !doseOutcome && (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={doseMutation.isPending}
                      onClick={async (e) => {
                        e.stopPropagation();
                        doseMutation.mutate(
                          { alertId: alert.alertId, status: "taken" },
                          {
                            onSuccess: (d) => {
                              setDoseOutcome(d.status as "taken" | "late");
                              onAcknowledge?.({
                                ...alert,
                                isAcknowledged: true,
                                status: "Acknowledged",
                              });
                            },
                          }
                        );
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {doseMutation.isPending
                        ? t("saving", "Saving…")
                        : t("med_taken", "Taken")}
                    </button>
                    <button
                      type="button"
                      disabled={doseMutation.isPending}
                      onClick={async (e) => {
                        e.stopPropagation();
                        doseMutation.mutate(
                          { alertId: alert.alertId, status: "missed" },
                          {
                            onSuccess: () => {
                              setDoseOutcome("missed");
                              onAcknowledge?.({
                                ...alert,
                                isAcknowledged: true,
                                status: "Acknowledged",
                              });
                            },
                          }
                        );
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted/60 disabled:opacity-60"
                    >
                      <Clock className="h-4 w-4" />
                      {t("med_not_taken", "Didn't take")}
                    </button>
                  </div>
                  {doseMutation.isError ? (
                    <p className="text-xs text-destructive">
                      {t("med_respond_failed", "Could not save response. Try again.")}
                    </p>
                  ) : null}
                </div>
              )}

              {isMedReminder && doseOutcome && (
                <div className="flex justify-end">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                      doseOutcome === "taken"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                        : doseOutcome === "late"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                    )}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {doseOutcome === "taken"
                      ? t("med_recorded_taken", "Recorded as taken")
                      : doseOutcome === "late"
                      ? t("med_recorded_late", "Recorded as late")
                      : t("med_recorded_missed", "Recorded as missed")}
                  </span>
                </div>
              )}

              {/* Acknowledge action (live alerts only) */}
              {onAcknowledge && !alert.isAcknowledged && !(isMedReminder && doseOutcome) && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={acking}
                    onClick={async (e) => {
                      e.stopPropagation();
                      setAcking(true);
                      try {
                        const updated = await actOnAlert(alert.alertId, 'acknowledge');
                        onAcknowledge(mapBackendAlert(updated));
                      } catch {
                        /* surfaced via disabled state reset */
                      } finally {
                        setAcking(false);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {acking ? t('acknowledging', 'Acknowledging...') : t('acknowledge', 'Acknowledge')}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

type AckFilter = "all" | "pending" | "acknowledged";

const AlertList: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<AlertType["severity"] | "all">("all");
  const [ackFilter, setAckFilter] = useState<AckFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const isRtl = (i18n.language || 'en').startsWith('fa');

  const { alerts: liveAlerts, status, upsertAlert } = useAlertWebSocket();
  // Use real alerts only — show an empty state when the live pipeline has nothing yet.
  const alerts = liveAlerts;

  const handleAcknowledge = useCallback((updated: AlertType) => {
    upsertAlert(updated);
  }, [upsertAlert]);

  const statusMeta: Record<string, { label: string; dot: string }> = {
    connected: { label: t('live', 'Live'), dot: 'bg-emerald-500' },
    connecting: { label: t('connecting', 'Connecting...'), dot: 'bg-amber-500' },
    disconnected: { label: t('reconnecting', 'Reconnecting...'), dot: 'bg-amber-500' },
    error: { label: t('offline', 'Offline'), dot: 'bg-rose-500' },
  };

  // Swipeable-styled Filter Cards (Swipe support on mobile!)
  const severities: { id: AlertType["severity"] | "all"; label: string; count: number; color: string; badge: string; shadow: string }[] = useMemo(() => {
    const counts = {
      all: alerts.length,
      critical: alerts.filter(a => a.severity === "critical").length,
      high: alerts.filter(a => a.severity === "high").length,
      medium: alerts.filter(a => a.severity === "medium").length,
      low: alerts.filter(a => a.severity === "low").length,
    };

    return [
      { id: "all", label: t('all', 'All'), count: counts.all, color: "bg-primary text-primary-foreground", badge: "bg-primary-foreground/20 text-primary-foreground", shadow: "shadow-primary/15" },
      { id: "critical", label: t('critical', 'Critical'), count: counts.critical, color: "bg-rose-500 text-white", badge: "bg-white/25 text-white", shadow: "shadow-rose-500/15" },
      { id: "high", label: t('high', 'High'), count: counts.high, color: "bg-amber-500 text-white", badge: "bg-white/25 text-white", shadow: "shadow-amber-500/15" },
      { id: "medium", label: t('medium', 'Medium'), count: counts.medium, color: "bg-sky-500 text-white", badge: "bg-white/25 text-white", shadow: "shadow-sky-500/15" },
      { id: "low", label: t('low', 'Low'), count: counts.low, color: "bg-emerald-500 text-white", badge: "bg-white/25 text-white", shadow: "shadow-emerald-500/15" },
    ];
  }, [t, alerts]);

  const ackFilters: { id: AckFilter; label: string; count: number }[] = useMemo(() => {
    const pending = alerts.filter((a) => !a.isAcknowledged).length;
    const acknowledged = alerts.filter((a) => a.isAcknowledged).length;
    return [
      { id: "all", label: t("all_statuses", "All statuses"), count: alerts.length },
      { id: "pending", label: t("pending", "Pending"), count: pending },
      { id: "acknowledged", label: t("acknowledged", "Acknowledged"), count: acknowledged },
    ];
  }, [t, alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts
      .filter((alert) => {
        const matchesSeverity = filter === "all" || alert.severity === filter;
        const matchesAck =
          ackFilter === "all" ||
          (ackFilter === "pending" && !alert.isAcknowledged) ||
          (ackFilter === "acknowledged" && !!alert.isAcknowledged);
        const mappedType = alertTypeLabels[alert.alertType]
          ? (isRtl ? alertTypeLabels[alert.alertType].fa : alertTypeLabels[alert.alertType].en)
          : alert.alertType;
        const matchesSearch =
          searchQuery.trim() === "" ||
          mappedType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (alert.notes && alert.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (alert.sensorData?.activity && alert.sensorData.activity.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesSeverity && matchesAck && matchesSearch;
      })
      .sort(compareAlertsBySeverityThenTime);
  }, [filter, ackFilter, searchQuery, isRtl, alerts]);

  return (
    <PageContainer scrollable>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <Heading
            title={t("health_alerts_dashboard", "Health Alerts Panel")}
            description={t(
              "alerts_subdescription",
              "Real-time physiological alerts and predictive clinical indicators powered by SenioSentry AI."
            )}
          />
          <span className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold">
            <span className={cn("h-2 w-2 rounded-full", statusMeta[status]?.dot, status === 'connected' ? 'animate-pulse' : '')} />
            {statusMeta[status]?.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {severities.map((sev) => {
            const isSelected = filter === sev.id;

            return (
              <motion.button
                whileTap={{ scale: 0.97 }}
                key={sev.id}
                type="button"
                onClick={() => setFilter(sev.id)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200",
                  isSelected
                    ? `${sev.color} ${sev.shadow} border-transparent`
                    : "border-border bg-card text-foreground hover:bg-muted/50"
                )}
              >
                <span className="truncate">{sev.label}</span>
                <span
                  className={cn(
                    "flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md px-1.5 text-xs font-bold ltr-nums",
                    isSelected
                      ? sev.badge
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {sev.count}
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {ackFilters.map((chip) => {
            const selected = ackFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setAckFilter(chip.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                )}
              >
                {chip.label}
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-bold ltr-nums",
                    selected ? "bg-primary-foreground/20" : "bg-muted"
                  )}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full">
          <div
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
              isRtl ? "right-3.5" : "left-3.5"
            )}
          >
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(
              "search_alerts_placeholder",
              "Search alerts by type, description, activity..."
            )}
            className={cn(
              "w-full rounded-xl border border-border bg-background py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20",
              isRtl ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"
            )}
          />
        </div>

        <div className="w-full space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredAlerts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center"
              >
                <div className="rounded-full bg-muted p-4">
                  <CheckCircle2 className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t(
                    "no_alerts_found",
                    "No physiological alerts found matching filters."
                  )}
                </p>
              </motion.div>
            ) : (
              filteredAlerts.map((alert) => (
                <AlertCard
                  key={alert.alertId}
                  alert={alert}
                  onAcknowledge={liveAlerts.length > 0 ? handleAcknowledge : undefined}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageContainer>
  );
};

export default AlertList;
