'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import axiosInstance from '@/api/axiosInstance';
import {
  useAppointments,
  type AppointmentSummary,
  type VisitReportDetail,
} from '@/features/appointments/api/use-appointments';
import { cn } from '@/lib/utils';

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function statusVariant(
  status: AppointmentSummary['status'],
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'completed') return 'default';
  if (status === 'cancelled' || status === 'no_show') return 'destructive';
  if (status === 'confirmed') return 'secondary';
  return 'outline';
}

function VisitReportBody({ appointmentId }: { appointmentId: number }) {
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['visit-report', appointmentId],
    queryFn: async () => {
      try {
        const { data } = await axiosInstance.get<VisitReportDetail>(
          `/appointments/${appointmentId}/report`,
        );
        return data;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status === 404) return null;
        throw err;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('loading_report', 'Loading visit report…')}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-3 text-sm text-destructive">
        {(error as Error)?.message ||
          t('failed_load_report', 'Failed to load visit report.')}
      </p>
    );
  }

  if (!data) {
    return (
      <p className="py-3 text-sm text-muted-foreground">
        {t('no_visit_report', 'No visit report on file for this appointment.')}
      </p>
    );
  }

  const meds = Array.isArray(data.structured_medications)
    ? data.structured_medications
    : [];
  const profile = data.structured_profile || {};

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('clinical_note', 'Clinical note')}
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {data.clinical_note || t('no_notes', 'No notes available.')}
        </p>
      </div>

      {(profile.diagnosis ||
        profile.physician_notes ||
        profile.demographics) && (
        <>
          <Separator />
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.diagnosis ? (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('diagnosis', 'Diagnosis')}
                </p>
                <p className="text-sm">{String(profile.diagnosis)}</p>
              </div>
            ) : null}
            {profile.physician_notes ? (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('physician_notes', 'Physician Notes')}
                </p>
                <p className="whitespace-pre-wrap text-sm">
                  {String(profile.physician_notes)}
                </p>
              </div>
            ) : null}
            {profile.demographics ? (
              <div className="sm:col-span-2">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('demographics', 'Demographics')}
                </p>
                <p className="text-sm">{String(profile.demographics)}</p>
              </div>
            ) : null}
          </div>
        </>
      )}

      {meds.length > 0 ? (
        <>
          <Separator />
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('medications', 'Medications')}
            </p>
            <ul className="space-y-1.5 text-sm">
              {meds.map((m, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-border/60 bg-background px-3 py-2"
                >
                  <span className="font-medium">
                    {String(m.name || t('unnamed', 'Unnamed'))}
                  </span>
                  {m.dosage ? (
                    <span className="text-muted-foreground">
                      {' '}
                      — {String(m.dosage)}
                    </span>
                  ) : null}
                  {m.frequency ? (
                    <span className="text-muted-foreground">
                      , {String(m.frequency)}
                    </span>
                  ) : null}
                  {m.notes ? (
                    <span className="block text-xs italic text-muted-foreground">
                      {String(m.notes)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}

      {data.change_jobs?.length ? (
        <>
          <Separator />
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('apply_jobs', 'Record updates')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.change_jobs.map((job) => (
                <Badge key={job.id} variant="outline" className="text-xs">
                  {job.change_type} · {job.status}
                </Badge>
              ))}
            </div>
          </div>
        </>
      ) : null}

      <p className="text-end text-[11px] text-muted-foreground">
        {t('recorded_on', 'Recorded on')}: {formatWhen(data.created_at)}
      </p>
    </div>
  );
}

function AppointmentHistoryRow({ appt }: { appt: AppointmentSummary }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const canHaveReport = appt.status === 'completed';

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => canHaveReport && setOpen((v) => !v)}
        className={cn(
          'flex w-full items-start gap-3 p-4 text-start transition-colors',
          canHaveReport && 'hover:bg-muted/30',
          !canHaveReport && 'cursor-default',
        )}
      >
        <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
          {canHaveReport ? (
            <FileText className="h-4 w-4" />
          ) : (
            <CalendarDays className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold tabular-nums">
              {formatWhen(appt.scheduled_at)}
            </p>
            <Badge variant={statusVariant(appt.status)} className="text-xs">
              {t(`appointment_status_${appt.status}`, appt.status)}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {appt.duration_minutes} min
            {appt.reason ? ` · ${appt.reason}` : ''}
          </p>
        </div>
        {canHaveReport ? (
          open ? (
            <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground rtl:-scale-x-100" />
          )
        ) : null}
      </button>
      {open && canHaveReport ? (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <VisitReportBody appointmentId={appt.id} />
        </div>
      ) : null}
    </div>
  );
}

export default function PatientAppointmentHistory({
  patientId,
}: {
  patientId: number;
}) {
  const { t } = useTranslation();
  const { data = [], isLoading, isError } = useAppointments({
    patient_id: patientId,
  });

  const sorted = useMemo(() => {
    return [...data].sort(
      (a, b) =>
        new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime(),
    );
  }, [data]);

  const completedWithPossibleReport = sorted.filter(
    (a) => a.status === 'completed',
  ).length;

  return (
    <Card className="rounded-3xl border border-zinc-200/80 bg-white/70 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold tracking-tight">
              {t('appointment_history', 'Appointment history')}
            </CardTitle>
          </div>
          {completedWithPossibleReport > 0 ? (
            <p className="text-xs text-muted-foreground">
              {t(
                'expand_completed_for_reports',
                'Expand a completed visit to view its report.',
              )}
            </p>
          ) : null}
        </div>
        <Separator className="mt-3" />
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('loading', 'Loading...')}
          </div>
        ) : isError ? (
          <p className="py-6 text-center text-sm text-destructive">
            {t(
              'failed_load_appointments',
              'Failed to load appointments',
            )}
          </p>
        ) : sorted.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            {t('no_appointments', 'No appointments scheduled')}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {sorted.map((appt) => (
              <AppointmentHistoryRow key={appt.id} appt={appt} />
            ))}
          </div>
        )}
        {sorted.length > 0 && completedWithPossibleReport === 0 ? (
          <p className="pt-1 text-center text-xs text-muted-foreground">
            {t(
              'no_completed_visits_yet',
              'Completed visits with reports will appear here once filed.',
            )}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
