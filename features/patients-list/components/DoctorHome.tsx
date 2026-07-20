'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Stethoscope,
} from 'lucide-react';

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { usePatients } from '@/features/patients-list/api/useGetPatients';
import { staffPatientRoutes } from '@/features/patient-knowledge/utils/staffRoutes';
import { useUser } from '@/context/UserContext';
import { useDoctorWidget } from '@/features/appointments/api/use-appointments';
import { fetchAlertHistory } from '@/features/alert/api/alertApi';
import {
  AddPatientButton,
  InviteCaregiverButton,
} from './CareTeamActions';
import {
  PatientCard,
  SectionTitle,
  StaffPanelSkeleton,
  type PatientCardStatus,
} from './staff-ui';

function patientName(
  first?: string | null,
  last?: string | null,
  username?: string | null,
  fallbackId?: number,
) {
  const n = `${first || ''} ${last || ''}`.trim();
  return n || username || (fallbackId != null ? `#${fallbackId}` : '—');
}

export default function DoctorHome() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useUser();
  const { data: patients, isLoading, error } = usePatients(true);
  const widget = useDoctorWidget();

  const patientIds = useMemo(
    () => new Set((patients ?? []).map((p) => p.id)),
    [patients],
  );

  const { data: alerts = [] } = useQuery({
    queryKey: ['doctor-home-alerts'],
    queryFn: () => fetchAlertHistory({ limit: 120 }),
    staleTime: 60_000,
  });

  const alertedPatientIds = useMemo(() => {
    const ids = new Set<number>();
    for (const a of alerts) {
      if (!patientIds.has(a.user_id)) continue;
      const sev = String(a.severity || '').toLowerCase();
      if (sev === 'critical' || sev === 'high') ids.add(a.user_id);
    }
    return ids;
  }, [alerts, patientIds]);

  const attentionPatients = useMemo(() => {
    const list = patients ?? [];
    const ranked = list
      .map((p) => {
        let status: PatientCardStatus = 'ok';
        let rank = 3;
        if (alertedPatientIds.has(p.id)) {
          status = 'needs_attention';
          rank = 0;
        } else if (p.records_complete === false) {
          status = 'incomplete';
          rank = 1;
        } else if (!p.caregiver_id) {
          status = 'needs_attention';
          rank = 2;
        } else if (String(p.status).toLowerCase() !== 'active') {
          status = 'inactive';
          rank = 2;
        }
        return { patient: p, status, rank };
      })
      .filter((x) => x.rank < 3)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 6);
    return ranked;
  }, [patients, alertedPatientIds]);

  const todayAppointments = useMemo(() => {
    const upcoming = widget.data?.upcoming ?? [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return upcoming
      .filter((a) => {
        const d = new Date(a.scheduled_at);
        return d >= start && d <= end;
      })
      .slice(0, 5);
  }, [widget.data?.upcoming]);

  if (isLoading) {
    return (
      <PageContainer scrollable>
        <StaffPanelSkeleton />
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-col gap-10">
        {/* First viewport: one composition */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary">
              <Stethoscope className="h-3.5 w-3.5" />
              {t('clinic_floor', 'Clinic floor')}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t('hi_welcome_back', {
                name: user?.first_name || t('doctor', 'Doctor'),
              })}
            </h1>
            <p className="max-w-lg text-sm text-muted-foreground">
              {t(
                'doctor_home_focus',
                'Caseload risk, today’s visits, and the next clinical step.',
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <InviteCaregiverButton />
            <AddPatientButton />
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/patients')}
            >
              {t('all_patients', 'All Patients')}
              <ArrowRight className="ms-1.5 h-4 w-4 rtl:-scale-x-100" />
            </Button>
          </div>
        </header>

        {error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : null}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Caseload risk */}
          <section>
            <SectionTitle
              title={t('caseload_risk', 'Needs attention')}
              description={t(
                'caseload_risk_desc',
                'High alerts, incomplete records, or no caregiver.',
              )}
            />
            {attentionPatients.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                {t('caseload_clear', 'Caseload looks clear right now.')}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {attentionPatients.map(({ patient, status }) => {
                  const routes = staffPatientRoutes(user?.role, patient.id);
                  return (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                      status={status}
                      ctaLabel={
                        status === 'incomplete'
                          ? t('complete_records', 'Complete')
                          : t('review', 'Review')
                      }
                      onOpen={() =>
                        router.push(
                          status === 'incomplete'
                            ? routes.importRoute
                            : routes.detailRoute,
                        )
                      }
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* Today's appointments */}
          <section>
            <SectionTitle
              title={t('todays_appointments', "Today’s appointments")}
              description={
                widget.data
                  ? t('today_count_label', '{{count}} today · {{pending}} pending', {
                      count: widget.data.today_count,
                      pending: widget.data.pending_count,
                    })
                  : undefined
              }
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => router.push('/dashboard/appointments')}
                >
                  {t('schedule', 'Schedule')}
                  <ArrowRight className="ms-1 h-3.5 w-3.5 rtl:-scale-x-100" />
                </Button>
              }
            />
            {widget.isLoading ? (
              <div className="h-32 animate-pulse rounded-xl bg-muted/50" />
            ) : todayAppointments.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                {t('no_appointments_today', 'No visits scheduled for today.')}
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {todayAppointments.map((appt) => {
                  const p = (patients ?? []).find((x) => x.id === appt.patient_id);
                  const when = new Date(appt.scheduled_at).toLocaleTimeString(
                    undefined,
                    { hour: '2-digit', minute: '2-digit' },
                  );
                  return (
                    <li key={appt.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-3.5 py-3 text-start transition-colors hover:bg-muted/40"
                        onClick={() =>
                          router.push('/dashboard/appointments')
                        }
                      >
                        <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {patientName(
                              p?.first_name,
                              p?.last_name,
                              p?.username,
                              appt.patient_id,
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {when}
                            {appt.reason ? ` · ${appt.reason}` : ''}
                          </p>
                        </div>
                        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {t(`appointment_status_${appt.status}`, appt.status)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Clinical actions — three only */}
          <section>
            <SectionTitle
              title={t('clinical_actions', 'Clinical actions')}
              description={t(
                'clinical_actions_desc',
                'Open work — not a shortcut wall.',
              )}
            />
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="h-auto justify-start gap-3 px-3.5 py-3"
                onClick={() => router.push('/dashboard/patient-alert')}
              >
                <ClipboardList className="h-4 w-4 text-primary" />
                <span className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-medium">
                    {t('patient_alerts', 'Patient Alerts')}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {t('review_clinical_alerts', 'Review clinical alerts')}
                  </span>
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-auto justify-start gap-3 px-3.5 py-3"
                onClick={() => router.push('/dashboard/appointments')}
              >
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-medium">
                    {t('appointments', 'Appointments')}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {t('manage_schedule', 'Manage visits and availability')}
                  </span>
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-auto justify-start gap-3 px-3.5 py-3"
                onClick={() => router.push('/dashboard/fall-reports')}
              >
                <Stethoscope className="h-4 w-4 text-primary" />
                <span className="flex flex-col items-start gap-0.5">
                  <span className="text-sm font-medium">
                    {t('fall_reports', 'Fall reports')}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {t('review_fall_events', 'Review fall detection events')}
                  </span>
                </span>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </PageContainer>
  );
}
