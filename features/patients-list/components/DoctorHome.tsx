'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Brain,
  CalendarDays,
  Camera,
  ClipboardList,
  MessageCircle,
  ShieldAlert,
  Stethoscope,
  UserCheck,
  Users,
} from 'lucide-react';

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { usePatients } from '@/features/patients-list/api/useGetPatients';
import { staffPatientRoutes } from '@/features/patient-knowledge/utils/staffRoutes';
import { useUser } from '@/context/UserContext';
import { useDoctorWidget } from '@/features/appointments/api/use-appointments';
import { fetchAlertHistory } from '@/features/alert/api/alertApi';
import AppointmentsWidget from '@/features/appointments/components/AppointmentsWidget';
import {
  AddPatientButton,
  InviteCaregiverButton,
} from './CareTeamActions';
import StaffCaseloadInsights from './StaffCaseloadInsights';
import {
  PatientCard,
  SectionTitle,
  StaffPanelSkeleton,
  StaffQuickAction,
  StaffStatCard,
  StaffSurface,
  type PatientCardStatus,
} from './staff-ui';

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
    queryFn: () => fetchAlertHistory({ limit: 200 }),
    staleTime: 60_000,
  });

  const scopedAlerts = useMemo(
    () =>
      alerts.filter((a) => patientIds.size === 0 || patientIds.has(a.user_id)),
    [alerts, patientIds],
  );

  const openHighCritical = useMemo(() => {
    return scopedAlerts.filter((a) => {
      const sev = String(a.severity || '').toLowerCase();
      const open =
        !a.status ||
        ['active', 'open', 'acknowledged'].includes(
          String(a.status).toLowerCase(),
        );
      return open && (sev === 'high' || sev === 'critical');
    }).length;
  }, [scopedAlerts]);

  const stats = useMemo(() => {
    const list = patients ?? [];
    return {
      total: list.length,
      active: list.filter((p) => String(p.status).toLowerCase() === 'active')
        .length,
      incomplete: list.filter((p) => p.records_complete === false).length,
      uncovered: list.filter((p) => !p.caregiver_id).length,
      openHighCritical,
      today: widget.data?.today_count ?? 0,
      pendingAppt: widget.data?.pending_count ?? 0,
    };
  }, [patients, openHighCritical, widget.data]);

  const alertedPatientIds = useMemo(() => {
    const ids = new Set<number>();
    for (const a of scopedAlerts) {
      const sev = String(a.severity || '').toLowerCase();
      if (sev === 'critical' || sev === 'high') ids.add(a.user_id);
    }
    return ids;
  }, [scopedAlerts]);

  const attentionPatients = useMemo(() => {
    const list = patients ?? [];
    return list
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
  }, [patients, alertedPatientIds]);

  if (isLoading) {
    return (
      <PageContainer scrollable>
        <StaffPanelSkeleton />
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-col gap-8">
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
            <p className="max-w-xl text-sm text-muted-foreground">
              {t(
                'doctor_home_blurb',
                'Your caseload at a glance — appointments, alerts, and patients who need follow-up.',
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <InviteCaregiverButton />
            <AddPatientButton />
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/chat')}
            >
              <MessageCircle className="me-1.5 h-4 w-4" />
              {t('chat', 'Chat')}
            </Button>
            <Button onClick={() => router.push('/dashboard/patients')}>
              <Users className="me-1.5 h-4 w-4" />
              {t('all_patients', 'All Patients')}
              <ArrowRight className="ms-1.5 h-4 w-4 rtl:-scale-x-100" />
            </Button>
          </div>
        </header>

        {error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : null}

        {/* Metrics overview */}
        <section>
          <SectionTitle
            title={t('caseload_overview', 'Caseload overview')}
            description={t(
              'caseload_overview_desc',
              'Live counts across your patients and today’s schedule.',
            )}
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StaffStatCard
              label={t('total_patients', 'Total Patients')}
              value={stats.total}
              icon={Users}
              onClick={() => router.push('/dashboard/patients')}
            />
            <StaffStatCard
              label={t('active_patients', 'Active')}
              value={stats.active}
              icon={UserCheck}
            />
            <StaffStatCard
              label={t('records_incomplete', 'Incomplete')}
              value={stats.incomplete}
              icon={ClipboardList}
              onClick={() => router.push('/dashboard/patients')}
            />
            <StaffStatCard
              label={t('uncovered_patients', 'Uncovered')}
              value={stats.uncovered}
              icon={ShieldAlert}
            />
            <StaffStatCard
              label={t('open_high_critical_short', 'High alerts')}
              value={stats.openHighCritical}
              icon={ShieldAlert}
              onClick={() => router.push('/dashboard/patient-alert')}
            />
            <StaffStatCard
              label={t('today_appointments', 'Today')}
              value={stats.today}
              icon={CalendarDays}
              onClick={() => router.push('/dashboard/appointments')}
            />
          </div>
        </section>

        {/* Charts */}
        <section>
          <SectionTitle
            title={t('patient_insights', 'Patient insights')}
            description={t(
              'patient_insights_desc',
              'Alert trend, severity mix, and caseload status.',
            )}
          />
          <StaffCaseloadInsights patients={patients ?? []} />
        </section>

        {/* Appointments + attention + fast access */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-4">
            <AppointmentsWidget />
          </div>

          <StaffSurface className="flex flex-col gap-3 p-5 xl:col-span-5">
            <SectionTitle
              title={t('caseload_risk', 'Needs attention')}
              description={t(
                'caseload_risk_desc',
                'High alerts, incomplete records, or no caregiver.',
              )}
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => router.push('/dashboard/patients')}
                >
                  {t('view_all', 'View all')}
                  <ArrowRight className="ms-1 h-3.5 w-3.5 rtl:-scale-x-100" />
                </Button>
              }
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
          </StaffSurface>

          <StaffSurface className="flex flex-col gap-2 p-5 xl:col-span-3">
            <SectionTitle
              title={t('fast_access', 'Fast access')}
              description={t(
                'fast_access_desc',
                'Jump to the tools you use every day.',
              )}
            />
            <StaffQuickAction
              label={t('patients', 'Patients')}
              description={t(
                'manage_patient_records',
                'View and manage patient records',
              )}
              icon={Users}
              onClick={() => router.push('/dashboard/patients')}
            />
            <StaffQuickAction
              label={t('patient_alerts', 'Patient Alerts')}
              description={t(
                'review_clinical_alerts',
                'Review clinical alerts',
              )}
              icon={ShieldAlert}
              onClick={() => router.push('/dashboard/patient-alert')}
            />
            <StaffQuickAction
              label={t('appointments', 'Appointments')}
              description={t(
                'manage_schedule',
                'Manage visits and availability',
              )}
              icon={CalendarDays}
              onClick={() => router.push('/dashboard/appointments')}
            />
            <StaffQuickAction
              label={t('fall_reports', 'Fall reports')}
              description={t(
                'review_fall_events',
                'Review fall detection events',
              )}
              icon={Camera}
              onClick={() => router.push('/dashboard/fall-reports')}
            />
            <StaffQuickAction
              label={t('ai_chat', 'AI Chat')}
              description={t(
                'ai_assistant_description',
                'Ask the AI health assistant',
              )}
              icon={Brain}
              onClick={() => router.push('/dashboard/ai')}
            />
            <StaffQuickAction
              label={t('chat', 'Chat')}
              description={t(
                'contact_patients',
                'Contact and message patients',
              )}
              icon={MessageCircle}
              onClick={() => router.push('/dashboard/chat')}
            />
          </StaffSurface>
        </div>
      </div>
    </PageContainer>
  );
}
