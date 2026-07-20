'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, Brain, ShieldAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { fetchAlertHistory } from '@/features/alert/api/alertApi';
import type { User } from '@/features/dashboard/types/caregiver/user';
import { cn } from '@/lib/utils';
import { StaffSurface } from './staff-ui';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#e11d48',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#94a3b8',
};

const CHART = {
  blue: 'hsl(221 83% 53%)',
  teal: '#14b8a6',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  slate: '#94a3b8',
};

type Props = {
  patients: User[];
  alertsRoute?: string;
  aiRoute?: string;
};

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
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
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      {label ? <p className="mb-1 font-medium text-foreground">{label}</p> : null}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-muted-foreground">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.color }}
          />
          <span>
            {p.name}: <span className="font-semibold text-foreground">{p.value}</span>
          </span>
        </p>
      ))}
    </div>
  );
}

export default function StaffCaseloadInsights({
  patients,
  alertsRoute = '/dashboard/patient-alert',
  aiRoute = '/dashboard/ai',
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['staff-caseload-alerts'],
    queryFn: () => fetchAlertHistory({ limit: 200 }),
    staleTime: 60_000,
  });

  const patientIds = useMemo(
    () => new Set(patients.map((p) => p.id)),
    [patients],
  );

  const scopedAlerts = useMemo(
    () =>
      alerts.filter((a) => patientIds.size === 0 || patientIds.has(a.user_id)),
    [alerts, patientIds],
  );

  const last7Days = useMemo(() => {
    const days: {
      day: string;
      label: string;
      count: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push({
        day: dayKey(d),
        label: d.toLocaleDateString(undefined, { weekday: 'short' }),
        count: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      });
    }
    const idx = new Map(days.map((d, i) => [d.day, i]));
    for (const a of scopedAlerts) {
      if (!a.timestamp) continue;
      const key = dayKey(new Date(a.timestamp));
      const i = idx.get(key);
      if (i == null) continue;
      days[i].count += 1;
      const s = String(a.severity || 'medium').toLowerCase();
      if (s === 'critical' || s === 'high' || s === 'medium' || s === 'low') {
        days[i][s] += 1;
      } else {
        days[i].medium += 1;
      }
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
      const s = String(a.severity || 'medium').toLowerCase();
      if (s in counts) counts[s] += 1;
      else counts.medium += 1;
    }
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({
        name: t(name, name),
        key: name,
        value,
      }));
  }, [scopedAlerts, t]);

  const statusBreakdown = useMemo(() => {
    const active = patients.filter((p) => p.status === 'active').length;
    const inactive = patients.filter((p) => p.status === 'inactive').length;
    const incomplete = patients.filter(
      (p) => p.records_complete === false,
    ).length;
    return [
      { name: t('active', 'Active'), value: active, fill: CHART.emerald },
      { name: t('inactive', 'Inactive'), value: inactive, fill: CHART.amber },
      {
        name: t('records_incomplete', 'Incomplete'),
        value: incomplete,
        fill: CHART.rose,
      },
    ].filter((d) => d.value > 0);
  }, [patients, t]);

  const coverage = useMemo(() => {
    const covered = patients.filter((p) => Boolean(p.caregiver_id)).length;
    const uncovered = Math.max(patients.length - covered, 0);
    const pct =
      patients.length === 0
        ? 0
        : Math.round((covered / patients.length) * 100);
    return {
      covered,
      uncovered,
      pct,
      radial: [
        {
          name: t('caregiver_coverage', 'Coverage'),
          value: pct,
          fill: CHART.teal,
        },
      ],
      pie: [
        {
          name: t('covered', 'Covered'),
          value: covered,
          fill: CHART.teal,
        },
        {
          name: t('uncovered_patients', 'Uncovered'),
          value: uncovered,
          fill: CHART.rose,
        },
      ].filter((d) => d.value > 0),
    };
  }, [patients, t]);

  const recordsHealth = useMemo(() => {
    const complete = patients.filter((p) => p.records_complete !== false).length;
    const incomplete = patients.length - complete;
    const pct =
      patients.length === 0
        ? 0
        : Math.round((complete / patients.length) * 100);
    return {
      complete,
      incomplete,
      pct,
      radial: [
        {
          name: t('records_complete', 'Complete'),
          value: pct,
          fill: CHART.blue,
        },
      ],
    };
  }, [patients, t]);

  const hotPatients = useMemo(() => {
    const byUser = new Map<number, number>();
    for (const a of scopedAlerts) {
      const open =
        !a.status ||
        ['active', 'open', 'acknowledged'].includes(
          String(a.status).toLowerCase(),
        );
      if (!open) continue;
      byUser.set(a.user_id, (byUser.get(a.user_id) || 0) + 1);
    }
    return [...byUser.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, count]) => {
        const p = patients.find((x) => x.id === id);
        const name = p
          ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.username
          : `#${id}`;
        return {
          id,
          count,
          name: name.length > 18 ? `${name.slice(0, 16)}…` : name,
          fullName: name,
        };
      });
  }, [scopedAlerts, patients]);

  const openHigh = scopedAlerts.filter((a) => {
    const sev = String(a.severity || '').toLowerCase();
    const open =
      !a.status ||
      ['active', 'open', 'acknowledged'].includes(
        String(a.status).toLowerCase(),
      );
    return open && (sev === 'high' || sev === 'critical');
  }).length;

  const weekTotal = last7Days.reduce((s, d) => s + d.count, 0);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      {/* Alert volume — area */}
      <StaffSurface className="p-5 xl:col-span-7">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold tracking-tight">
              {t('alerts_last_7_days', 'Alerts — last 7 days')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? t('loading', 'Loading...')
                : t('alerts_week_volume', '{{count}} alerts this week', {
                    count: weekTotal,
                  })}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(alertsRoute)}
          >
            <ShieldAlert className="me-1.5 h-3.5 w-3.5" />
            {t('view_alerts', 'View alerts')}
          </Button>
        </div>
        <div className="h-56 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={last7Days}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="alertFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.blue} stopOpacity={0.4} />
                  <stop
                    offset="100%"
                    stopColor={CHART.blue}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                name={t('alerts', 'Alerts')}
                stroke={CHART.blue}
                fill="url(#alertFill)"
                strokeWidth={2.5}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </StaffSurface>

      {/* Severity donut */}
      <StaffSurface className="p-5 xl:col-span-5">
        <h3 className="mb-1 text-base font-semibold tracking-tight">
          {t('severity_mix', 'Severity mix')}
        </h3>
        <p className="mb-2 text-xs text-muted-foreground">
          {t('open_high_critical', '{{count}} open high/critical', {
            count: openHigh,
          })}
        </p>
        <div className="h-56 w-full">
          {severityBreakdown.length === 0 ? (
            <p className="flex h-full items-center justify-center text-xs text-muted-foreground">
              {t('no_recent_alerts', 'No recent alerts')}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {severityBreakdown.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={SEVERITY_COLORS[entry.key] || CHART.slate}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={28}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </StaffSurface>

      {/* Stacked severity by day */}
      <StaffSurface className="p-5 xl:col-span-6">
        <h3 className="mb-1 text-base font-semibold tracking-tight">
          {t('severity_by_day', 'Severity by day')}
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">
          {t(
            'severity_by_day_desc',
            'How alert severity stacks across the week.',
          )}
        </p>
        <div className="h-52 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={last7Days}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 11 }}
              />
              <Bar
                dataKey="critical"
                name={t('critical', 'Critical')}
                stackId="sev"
                fill={SEVERITY_COLORS.critical}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="high"
                name={t('high', 'High')}
                stackId="sev"
                fill={SEVERITY_COLORS.high}
              />
              <Bar
                dataKey="medium"
                name={t('medium', 'Medium')}
                stackId="sev"
                fill={SEVERITY_COLORS.medium}
              />
              <Bar
                dataKey="low"
                name={t('low', 'Low')}
                stackId="sev"
                fill={SEVERITY_COLORS.low}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </StaffSurface>

      {/* Caseload status bars */}
      <StaffSurface className="p-5 xl:col-span-6">
        <h3 className="mb-1 text-base font-semibold tracking-tight">
          {t('caseload_status', 'Caseload status')}
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">
          {t('patients_in_panel', '{{count}} patients', {
            count: patients.length,
          })}
        </p>
        <div className="h-52 w-full">
          {statusBreakdown.length === 0 ? (
            <p className="flex h-full items-center justify-center text-xs text-muted-foreground">
              {t('no_patients_found', 'No patients found.')}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statusBreakdown}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                  horizontal={false}
                />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={88}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" name={t('patients', 'Patients')} radius={[0, 6, 6, 0]} barSize={22}>
                  {statusBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </StaffSurface>

      {/* Coverage radial */}
      <StaffSurface className="p-5 xl:col-span-4">
        <h3 className="mb-1 text-base font-semibold tracking-tight">
          {t('caregiver_coverage', 'Caregiver coverage')}
        </h3>
        <p className="mb-2 text-xs text-muted-foreground">
          {t('covered_of_total', '{{covered}} of {{total}} covered', {
            covered: coverage.covered,
            total: patients.length,
          })}
        </p>
        <div className="relative h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="68%"
              outerRadius="100%"
              data={coverage.radial}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar
                background={{ fill: 'hsl(var(--muted))' }}
                dataKey="value"
                cornerRadius={10}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {coverage.pct}%
            </p>
            <p className="text-[11px] text-muted-foreground">
              {t('covered', 'Covered')}
            </p>
          </div>
        </div>
      </StaffSurface>

      {/* Records completeness radial */}
      <StaffSurface className="p-5 xl:col-span-4">
        <h3 className="mb-1 text-base font-semibold tracking-tight">
          {t('records_health', 'Records health')}
        </h3>
        <p className="mb-2 text-xs text-muted-foreground">
          {t('complete_of_total', '{{complete}} complete · {{incomplete}} gaps', {
            complete: recordsHealth.complete,
            incomplete: recordsHealth.incomplete,
          })}
        </p>
        <div className="relative h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="68%"
              outerRadius="100%"
              data={recordsHealth.radial}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar
                background={{ fill: 'hsl(var(--muted))' }}
                dataKey="value"
                cornerRadius={10}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {recordsHealth.pct}%
            </p>
            <p className="text-[11px] text-muted-foreground">
              {t('records_complete', 'Complete')}
            </p>
          </div>
        </div>
      </StaffSurface>

      {/* Coverage pie split */}
      <StaffSurface className="p-5 xl:col-span-4">
        <h3 className="mb-1 text-base font-semibold tracking-tight">
          {t('coverage_split', 'Coverage split')}
        </h3>
        <p className="mb-2 text-xs text-muted-foreground">
          {t('with_vs_without_caregiver', 'With vs without a caregiver')}
        </p>
        <div className="h-48 w-full">
          {coverage.pie.length === 0 ? (
            <p className="flex h-full items-center justify-center text-xs text-muted-foreground">
              {t('no_patients_found', 'No patients found.')}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={coverage.pie}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={68}
                  paddingAngle={4}
                  strokeWidth={0}
                >
                  {coverage.pie.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={24}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </StaffSurface>

      {/* Hot patients — horizontal bars */}
      <StaffSurface className="p-5 xl:col-span-8">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-base font-semibold tracking-tight">
              {t('patients_needing_attention', 'Patients needing attention')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('by_open_alert_count', 'Ranked by open alert count')}
            </p>
          </div>
        </div>
        {hotPatients.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            {t(
              'no_open_alert_patients',
              'No patients with open alerts right now.',
            )}
          </p>
        ) : (
          <div className="h-56 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={hotPatients}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="hotBar" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={CHART.rose} stopOpacity={0.85} />
                    <stop offset="100%" stopColor={CHART.amber} stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                  horizontal={false}
                />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const row = payload[0].payload as (typeof hotPatients)[0];
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
                        <p className="font-medium">{row.fullName}</p>
                        <p className="text-muted-foreground">
                          {t('open_alerts_count', '{{count}} open alerts', {
                            count: row.count,
                          })}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="count"
                  name={t('alerts', 'Alerts')}
                  fill="url(#hotBar)"
                  radius={[0, 6, 6, 0]}
                  barSize={18}
                  cursor="pointer"
                  onClick={(data) => {
                    const id = Number(
                      (data as unknown as { id?: number | string })?.id,
                    );
                    if (Number.isFinite(id) && id > 0) {
                      router.push(`${aiRoute}?patientId=${id}`);
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </StaffSurface>

      <StaffSurface className="flex flex-col justify-between gap-4 p-5 xl:col-span-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight">
            {t('ai_clinical_assist', 'AI clinical assist')}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(
              'ai_clinical_assist_desc',
              'Open a patient-scoped AI chat to review meds, vitals, and risk context.',
            )}
          </p>
          {hotPatients.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {hotPatients.slice(0, 3).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`${aiRoute}?patientId=${p.id}`)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-start text-sm transition-colors hover:bg-muted/40',
                    )}
                  >
                    <span className="truncate font-medium">{p.fullName}</span>
                    <span className="ms-2 shrink-0 tabular-nums text-xs text-muted-foreground">
                      {p.count}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <Button onClick={() => router.push(aiRoute)}>
          <Brain className="me-2 h-4 w-4" />
          {t('open_ai_chat', 'Open AI chat')}
        </Button>
      </StaffSurface>
    </div>
  );
}
