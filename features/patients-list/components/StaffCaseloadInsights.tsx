"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Brain, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchAlertHistory } from "@/features/alert/api/alertApi";
import type { User } from "@/features/dashboard/types/caregiver/user";
import { cn } from "@/lib/utils";
import { StaffSurface } from "./staff-ui";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#e11d48",
  high: "#f59e0b",
  medium: "#3b82f6",
  low: "#94a3b8",
};

type Props = {
  patients: User[];
  alertsRoute?: string;
  aiRoute?: string;
};

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function StaffCaseloadInsights({
  patients,
  alertsRoute = "/dashboard/patient-alert",
  aiRoute = "/dashboard/ai",
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["staff-caseload-alerts"],
    queryFn: () => fetchAlertHistory({ limit: 200 }),
    staleTime: 60_000,
  });

  const patientIds = useMemo(() => new Set(patients.map((p) => p.id)), [patients]);

  const scopedAlerts = useMemo(
    () =>
      alerts.filter((a) => patientIds.size === 0 || patientIds.has(a.user_id)),
    [alerts, patientIds]
  );

  const last7Days = useMemo(() => {
    const days: { day: string; label: string; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push({
        day: dayKey(d),
        label: d.toLocaleDateString(undefined, { weekday: "short" }),
        count: 0,
      });
    }
    const idx = new Map(days.map((d, i) => [d.day, i]));
    for (const a of scopedAlerts) {
      if (!a.timestamp) continue;
      const key = dayKey(new Date(a.timestamp));
      const i = idx.get(key);
      if (i != null) days[i].count += 1;
    }
    return days;
  }, [scopedAlerts]);

  const severityBreakdown = useMemo(() => {
    const counts: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    for (const a of scopedAlerts) {
      const s = String(a.severity || "medium").toLowerCase();
      if (s in counts) counts[s] += 1;
      else counts.medium += 1;
    }
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [scopedAlerts]);

  const statusBreakdown = useMemo(() => {
    const active = patients.filter((p) => p.status === "active").length;
    const inactive = patients.filter((p) => p.status === "inactive").length;
    const incomplete = patients.filter((p) => p.records_complete === false).length;
    return [
      { name: t("active", "Active"), value: active, fill: "#10b981" },
      { name: t("inactive", "Inactive"), value: inactive, fill: "#f59e0b" },
      {
        name: t("records_incomplete", "Records incomplete"),
        value: incomplete,
        fill: "#f43f5e",
      },
    ].filter((d) => d.value > 0);
  }, [patients, t]);

  const hotPatients = useMemo(() => {
    const byUser = new Map<number, number>();
    for (const a of scopedAlerts) {
      const open =
        !a.status ||
        ["active", "open", "acknowledged"].includes(String(a.status).toLowerCase());
      if (!open) continue;
      byUser.set(a.user_id, (byUser.get(a.user_id) || 0) + 1);
    }
    return [...byUser.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, count]) => {
        const p = patients.find((x) => x.id === id);
        return {
          id,
          count,
          name: p
            ? `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.username
            : `#${id}`,
        };
      });
  }, [scopedAlerts, patients]);

  const openHigh = scopedAlerts.filter((a) => {
    const sev = String(a.severity || "").toLowerCase();
    const open =
      !a.status ||
      ["active", "open", "acknowledged"].includes(String(a.status).toLowerCase());
    return open && (sev === "high" || sev === "critical");
  }).length;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <StaffSurface className="xl:col-span-5 p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold tracking-tight">
              {t("alerts_last_7_days", "Alerts — last 7 days")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? t("loading", "Loading...")
                : t("alerts_week_sub", "{{count}} in your caseload", {
                    count: scopedAlerts.length,
                  })}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => router.push(alertsRoute)}>
            <ShieldAlert className="me-1.5 h-3.5 w-3.5" />
            {t("view_alerts", "View alerts")}
          </Button>
        </div>
        <div className="h-48 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={last7Days} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="alertFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(221 83% 53%)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(221 83% 53%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(221 83% 53%)"
                fill="url(#alertFill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </StaffSurface>

      <StaffSurface className="xl:col-span-3 p-5">
        <h3 className="mb-1 text-base font-semibold tracking-tight">
          {t("severity_mix", "Severity mix")}
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">
          {t("open_high_critical", "{{count}} open high/critical", { count: openHigh })}
        </p>
        <div className="h-44 w-full">
          {severityBreakdown.length === 0 ? (
            <p className="flex h-full items-center justify-center text-xs text-muted-foreground">
              {t("no_recent_alerts", "No recent alerts")}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={42}
                  outerRadius={68}
                  paddingAngle={2}
                >
                  {severityBreakdown.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={SEVERITY_COLORS[entry.name] || "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </StaffSurface>

      <StaffSurface className="xl:col-span-4 p-5">
        <h3 className="mb-1 text-base font-semibold tracking-tight">
          {t("caseload_status", "Caseload status")}
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">
          {t("patients_in_panel", "{{count}} patients", { count: patients.length })}
        </p>
        <div className="h-44 w-full">
          {statusBreakdown.length === 0 ? (
            <p className="flex h-full items-center justify-center text-xs text-muted-foreground">
              {t("no_patients_found", "No patients found.")}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusBreakdown} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {statusBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </StaffSurface>

      <StaffSurface className="xl:col-span-8 p-5">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold tracking-tight">
            {t("patients_needing_attention", "Patients needing attention")}
          </h3>
        </div>
        {hotPatients.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            {t("no_open_alert_patients", "No patients with open alerts right now.")}
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {hotPatients.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("open_alerts_count", "{{count}} open alerts", { count: p.count })}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => router.push(`${aiRoute}?patientId=${p.id}`)}
                >
                  <Brain className="me-1.5 h-3.5 w-3.5" />
                  {t("ask_ai", "Ask AI")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </StaffSurface>

      <StaffSurface className="xl:col-span-4 flex flex-col justify-between p-5">
        <div>
          <h3 className="text-base font-semibold tracking-tight">
            {t("ai_clinical_assist", "AI clinical assist")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(
              "ai_clinical_assist_desc",
              "Open a patient-scoped AI chat to review meds, vitals, and risk context."
            )}
          </p>
        </div>
        <Button className="mt-4" onClick={() => router.push(aiRoute)}>
          <Brain className="me-2 h-4 w-4" />
          {t("open_ai_chat", "Open AI chat")}
        </Button>
      </StaffSurface>
    </div>
  );
}
