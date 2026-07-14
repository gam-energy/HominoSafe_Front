"use client";

import React, { useCallback, useMemo, useState } from "react";
import { AlertType } from "../types/AlertSchema";
import { useAlertWebSocket } from "../hooks/useAlertWebSocket";
import { actOnAlert } from "../api/alertApi";
import { mapBackendAlert } from "../lib/alertTypeMap";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type AckFilter = "all" | "pending" | "acknowledged";

const severityMeta = {
  critical: {
    label: "Critical",
    color: "bg-rose-500 text-white",
    border: "border-rose-500",
  },
  high: {
    label: "High",
    color: "bg-amber-500 text-white",
    border: "border-amber-500",
  },
  medium: {
    label: "Medium",
    color: "bg-sky-500 text-white",
    border: "border-sky-500",
  },
  low: {
    label: "Low",
    color: "bg-emerald-500 text-white",
    border: "border-emerald-500",
  },
};

const AlertCardDoctor: React.FC<{
  alert: AlertType;
  onAcknowledge?: (alert: AlertType) => void;
}> = ({ alert, onAcknowledge }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [acking, setAcking] = useState(false);

  return (
    <div
      className={`max-w-4xl mx-auto mb-4 rounded-xl border-l-4 ${
        severityMeta[alert.severity].border
      } bg-white dark:bg-zinc-900 shadow-md transition hover:shadow-lg`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex flex-wrap items-center justify-between gap-3 p-4 text-start"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-800 dark:text-blue-300">
              {alert.alertType.replace(/_/g, " ")}
            </span>
            {alert.patientName ? (
              <span className="truncate text-xs text-muted-foreground">
                {alert.patientName}
              </span>
            ) : null}
          </div>
          <span className="text-xs text-muted-foreground ltr-nums">
            {new Date(alert.timestamp).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 text-xs rounded-full ${severityMeta[alert.severity].color}`}
          >
            {severityMeta[alert.severity].label}
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              alert.isAcknowledged
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
            )}
          >
            {alert.isAcknowledged
              ? t("acknowledged", "Acknowledged")
              : t("pending", "Pending")}
          </span>
        </div>
      </button>

      {alert.sensorData ? (
        <div className="flex flex-wrap gap-2 border-t px-4 py-2 text-xs text-muted-foreground dark:border-zinc-700">
          {alert.sensorData.heartRate != null ? (
            <span className="rounded-md bg-muted/60 px-2 py-1 ltr-nums">
              HR {alert.sensorData.heartRate} bpm
            </span>
          ) : null}
          {alert.sensorData.bp?.systolic != null ||
          alert.sensorData.bp?.diastolic != null ? (
            <span className="rounded-md bg-muted/60 px-2 py-1 ltr-nums">
              BP {alert.sensorData.bp?.systolic ?? "—"}/
              {alert.sensorData.bp?.diastolic ?? "—"}
            </span>
          ) : null}
          {alert.sensorData.spo2 != null ? (
            <span className="rounded-md bg-muted/60 px-2 py-1 ltr-nums">
              SpO₂ {alert.sensorData.spo2}%
            </span>
          ) : null}
          {alert.sensorData.temperature != null ? (
            <span className="rounded-md bg-muted/60 px-2 py-1 ltr-nums">
              Temp {alert.sensorData.temperature}°C
            </span>
          ) : null}
        </div>
      ) : null}

      {open && (
        <div className="space-y-4 border-t p-4 pt-3 text-sm dark:border-zinc-700">
          {alert.message || alert.notes ? (
            <p className="text-muted-foreground">{alert.message || alert.notes}</p>
          ) : null}

          <div>
            <strong>{t("vitals_recorded", "Vitals Recorded")}</strong>
            {alert.sensorData ? (
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {alert.sensorData.heartRate != null ? (
                  <li>Heart Rate: {alert.sensorData.heartRate} bpm</li>
                ) : null}
                {alert.sensorData.bp?.systolic != null ||
                alert.sensorData.bp?.diastolic != null ? (
                  <li>
                    Blood Pressure: {alert.sensorData.bp?.systolic ?? "—"}/
                    {alert.sensorData.bp?.diastolic ?? "—"} mmHg
                  </li>
                ) : null}
                {alert.sensorData.spo2 != null ? (
                  <li>SpO₂: {alert.sensorData.spo2}%</li>
                ) : null}
                {alert.sensorData.temperature != null ? (
                  <li>Temp: {alert.sensorData.temperature} °C</li>
                ) : null}
                {alert.sensorData.activity ? (
                  <li>Activity: {alert.sensorData.activity}</li>
                ) : null}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                {t(
                  "no_vitals_for_alert",
                  "No wearable vitals available near this alert time."
                )}
              </p>
            )}
          </div>

          {!alert.isAcknowledged && onAcknowledge ? (
            <button
              type="button"
              disabled={acking}
              onClick={async () => {
                try {
                  setAcking(true);
                  const updated = await actOnAlert(alert.alertId, "acknowledge");
                  onAcknowledge(mapBackendAlert(updated));
                } finally {
                  setAcking(false);
                }
              }}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {acking
                ? t("acknowledging", "Acknowledging...")
                : t("acknowledge", "Acknowledge")}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

const DoctorAlertList: React.FC = () => {
  const { t } = useTranslation();
  const [severityFilter, setSeverityFilter] = useState<
    AlertType["severity"] | "all"
  >("all");
  const [ackFilter, setAckFilter] = useState<AckFilter>("all");

  const { alerts: liveAlerts, status, upsertAlert } = useAlertWebSocket();

  const handleAcknowledge = useCallback(
    (updated: AlertType) => {
      upsertAlert(updated);
    },
    [upsertAlert]
  );

  const ackCounts = useMemo(() => {
    const pending = liveAlerts.filter((a) => !a.isAcknowledged).length;
    const acknowledged = liveAlerts.filter((a) => a.isAcknowledged).length;
    return { all: liveAlerts.length, pending, acknowledged };
  }, [liveAlerts]);

  const alerts = useMemo(() => {
    return (liveAlerts ?? [])
      .filter((a) => severityFilter === "all" || a.severity === severityFilter)
      .filter(
        (a) =>
          ackFilter === "all" ||
          (ackFilter === "pending" && !a.isAcknowledged) ||
          (ackFilter === "acknowledged" && !!a.isAcknowledged)
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [liveAlerts, severityFilter, ackFilter]);

  const statusLabel =
    status === "connected"
      ? t("live", "Live")
      : status === "connecting"
        ? t("connecting", "Connecting...")
        : status === "error"
          ? t("offline", "Offline")
          : t("reconnecting", "Reconnecting...");

  return (
    <div className="min-h-screen bg-blue-50 px-4 py-10 dark:bg-zinc-900">
      <h1 className="mb-2 text-center text-2xl font-bold text-blue-800 dark:text-blue-400">
        Doctor Alert Review Panel
      </h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        <span
          className={`inline-flex items-center gap-1.5 ${status === "connected" ? "text-emerald-600" : "text-amber-600"}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${status === "connected" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
          />
          {statusLabel}
        </span>
      </p>

      <div className="mb-3 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => setSeverityFilter("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
            severityFilter === "all"
              ? "bg-blue-600 text-white"
              : "bg-white dark:bg-zinc-800"
          }`}
        >
          {t("all", "All")}
        </button>
        {(Object.keys(severityMeta) as AlertType["severity"][]).map((sev) => (
          <button
            key={sev}
            type="button"
            onClick={() => setSeverityFilter(sev)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${severityMeta[sev].color}`}
          >
            {severityMeta[sev].label}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {(
          [
            ["all", t("all_statuses", "All statuses"), ackCounts.all],
            ["pending", t("pending", "Pending"), ackCounts.pending],
            [
              "acknowledged",
              t("acknowledged", "Acknowledged"),
              ackCounts.acknowledged,
            ],
          ] as const
        ).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setAckFilter(id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold",
              ackFilter === id
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-border bg-card text-muted-foreground"
            )}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {alerts.length === 0 ? (
        <p className="text-center text-gray-500">
          {t(
            "no_alerts",
            "No alerts found. Live data will appear here when sensors trigger an alert."
          )}
        </p>
      ) : (
        alerts.map((alert) => (
          <AlertCardDoctor
            key={alert.alertId}
            alert={alert}
            onAcknowledge={handleAcknowledge}
          />
        ))
      )}
    </div>
  );
};

export default DoctorAlertList;
