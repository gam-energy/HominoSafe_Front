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
  HeartHandshake,
  MessageCircle,
  Pill,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-react';

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { usePatients } from '@/features/patients-list/api/useGetPatients';
import {
  staffPatientRoutes,
  patientPublicRef,
} from '@/features/patient-knowledge/utils/staffRoutes';
import { useUser } from '@/context/UserContext';
import {
  fetchAlertHistory,
  fetchFallReports,
} from '@/features/alert/api/alertApi';
import { usePendingDoses } from '@/features/medicine/api/usePendingDoses';
import { AddPatientButton } from './CareTeamActions';
import {
  PatientCard,
  SectionTitle,
  StaffPanelSkeleton,
  StaffQuickAction,
  StaffStatCard,
  StaffSurface,
} from './staff-ui';

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function CaregiverHome() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useUser();
  const { data: patients, isLoading, error } = usePatients(true);
  const pendingDoses = usePendingDoses();

  const patientIds = useMemo(
    () => new Set((patients ?? []).map((p) => p.id)),
    [patients]
  );

  const { data: alerts = [] } = useQuery({
    queryKey: ['caregiver-home-alerts'],
    queryFn: () => fetchAlertHistory({ limit: 100 }),
    staleTime: 45_000,
  });

  const { data: falls = [] } = useQuery({
    queryKey: ['caregiver-home-falls'],
    queryFn: () => fetchFallReports({ limit: 12 }),
    staleTime: 45_000,
  });

  const unsettledAll = useMemo(() => {
    const byPatient = new Map<
      number,
      { severity: string; message: string; when: string }
    >();
    for (const a of alerts) {
      if (!patientIds.has(a.user_id)) continue;
      const sev = String(a.severity || 'medium').toLowerCase();
      if (sev !== 'critical' && sev !== 'high' && sev !== 'medium') continue;
      const prev = byPatient.get(a.user_id);
      const rank = sev === 'critical' ? 0 : sev === 'high' ? 1 : 2;
      const prevRank = prev
        ? prev.severity === 'critical'
          ? 0
          : prev.severity === 'high'
            ? 1
            : 2
        : 99;
      if (!prev || rank < prevRank) {
        byPatient.set(a.user_id, {
          severity: sev,
          message: a.message || a.alert_type || 'Alert',
          when: a.timestamp,
        });
      }
    }
    return (patients ?? [])
      .filter((p) => byPatient.has(p.id))
      .map((p) => ({
        patient: p,
        alert: byPatient.get(p.id)!,
      }))
      .sort((a, b) => {
        const ra =
          a.alert.severity === 'critical'
            ? 0
            : a.alert.severity === 'high'
              ? 1
              : 2;
        const rb =
          b.alert.severity === 'critical'
            ? 0
            : b.alert.severity === 'high'
              ? 1
              : 2;
        return ra - rb;
      });
  }, [alerts, patientIds, patients]);

  const unsettled = useMemo(() => unsettledAll.slice(0, 6), [unsettledAll]);

  const recentFallsAll = useMemo(() => {
    return falls
      .filter((f) => patientIds.size === 0 || patientIds.has(f.patient_id))
      .map((f) => {
        const p = (patients ?? []).find((x) => x.id === f.patient_id);
        const name = p
          ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.username
          : f.patient_name || `#${f.patient_id}`;
        return { ...f, displayName: name, patient: p };
      });
  }, [falls, patientIds, patients]);

  const recentFalls = useMemo(
    () => recentFallsAll.slice(0, 5),
    [recentFallsAll]
  );

  const medsDue = useMemo(
    () => (pendingDoses.data?.doses ?? []).slice(0, 6),
    [pendingDoses.data?.doses]
  );

  const stats = useMemo(() => {
    const list = patients ?? [];
    return {
      total: list.length,
      active: list.filter((p) => String(p.status).toLowerCase() === 'active')
        .length,
      unsettled: unsettledAll.length,
      falls: recentFallsAll.length,
      meds: pendingDoses.data?.doses?.length ?? 0,
    };
  }, [patients, unsettledAll.length, recentFallsAll.length, pendingDoses.data]);

  const householdPreview = useMemo(
    () => (patients ?? []).slice(0, 6),
    [patients]
  );

  if (isLoading) {
    return (
      <PageContainer scrollable>
        <StaffPanelSkeleton />
      </PageContainer>
    );
  }

  const emptyHousehold = (patients ?? []).length === 0;

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-primary">
              <HeartHandshake className="h-3.5 w-3.5" />
              {t('care_home', 'Care home')}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t('hi_welcome_back', {
                name: user?.first_name || t('caregiver', 'Caregiver'),
              })}
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              {t(
                'caregiver_home_blurb',
                'Your household at a glance — who needs you, meds due, falls, and quick tools.'
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AddPatientButton />
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/chat')}
            >
              <MessageCircle className="me-1.5 h-4 w-4" />
              {t('chat', 'Chat')}
            </Button>
            <Button onClick={() => router.push('/dashboard/my-patients')}>
              <Users className="me-1.5 h-4 w-4" />
              {t('my_household', 'My Household')}
              <ArrowRight className="ms-1.5 h-4 w-4 rtl:-scale-x-100" />
            </Button>
          </div>
        </header>

        {error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : null}

        {emptyHousehold ? (
          <StaffSurface className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <div className="rounded-2xl bg-primary/10 p-4 text-primary">
              <Users className="h-8 w-8" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-lg font-semibold">
                {t('no_household_yet', 'No one in your household yet')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t(
                  'no_household_yet_desc',
                  'Add a patient to start monitoring vitals, alerts, falls, and medications.'
                )}
              </p>
            </div>
            <AddPatientButton />
          </StaffSurface>
        ) : (
          <>
            <section>
              <SectionTitle
                title={t('my_household', 'My Household')}
                description={t(
                  'household_preview_desc',
                  'People you care for — open anyone to see vitals and care details.'
                )}
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => router.push('/dashboard/my-patients')}
                  >
                    {t('view_all', 'View all')}
                    <ArrowRight className="ms-1 h-3.5 w-3.5 rtl:-scale-x-100" />
                  </Button>
                }
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {householdPreview.map((patient) => {
                  const routes = staffPatientRoutes(
                    user?.role,
                    patientPublicRef(patient)
                  );
                  const unsettledHit = unsettled.find(
                    (u) => u.patient.id === patient.id
                  );
                  return (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                      status={unsettledHit ? 'unsettled' : 'ok'}
                      statusHint={unsettledHit?.alert.message}
                      ctaLabel={t('open', 'Open')}
                      onOpen={() => router.push(routes.detailRoute)}
                    />
                  );
                })}
              </div>
            </section>

            <section>
              <SectionTitle
                title={t('household_overview', 'Household overview')}
                description={t(
                  'household_overview_desc',
                  'Live counts across the people you care for.'
                )}
              />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                <StaffStatCard
                  label={t('household', 'Household')}
                  value={stats.total}
                  icon={Users}
                  onClick={() => router.push('/dashboard/my-patients')}
                />
                <StaffStatCard
                  label={t('active_patients', 'Active')}
                  value={stats.active}
                  icon={UserCheck}
                />
                <StaffStatCard
                  label={t('whos_unsettled', "Who’s unsettled")}
                  value={stats.unsettled}
                  icon={ShieldAlert}
                  onClick={() => router.push('/dashboard/patient-alert')}
                />
                <StaffStatCard
                  label={t('recent_falls', 'Recent falls')}
                  value={stats.falls}
                  icon={Camera}
                  onClick={() => router.push('/dashboard/fall-reports')}
                />
                <StaffStatCard
                  label={t('meds_due', 'Meds due')}
                  value={stats.meds}
                  icon={Pill}
                  onClick={() => router.push('/dashboard/patient-alert')}
                />
              </div>
            </section>

            <section className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
              <StaffSurface className="flex h-full min-h-[22rem] flex-col gap-3 overflow-hidden p-5 lg:col-span-3">
                <SectionTitle
                  title={t('whos_unsettled', "Who’s unsettled")}
                  description={t(
                    'whos_unsettled_desc',
                    'People with recent medium–critical alerts.'
                  )}
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => router.push('/dashboard/patient-alert')}
                    >
                      {t('all_alerts', 'Alerts')}
                      <ArrowRight className="ms-1 h-3.5 w-3.5 rtl:-scale-x-100" />
                    </Button>
                  }
                />
                {unsettled.length === 0 ? (
                  <p className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
                    {t('household_calm', 'Everyone looks settled right now.')}
                  </p>
                ) : (
                  <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto pe-1 sm:grid-cols-2 xl:grid-cols-3">
                    {unsettled.map(({ patient, alert }) => {
                      const routes = staffPatientRoutes(
                        user?.role,
                        patientPublicRef(patient)
                      );
                      return (
                        <PatientCard
                          key={patient.id}
                          patient={patient}
                          status="unsettled"
                          statusHint={alert.message}
                          ctaLabel={t('check_in', 'Check in')}
                          onOpen={() => router.push(routes.detailRoute)}
                        />
                      );
                    })}
                  </div>
                )}
              </StaffSurface>
            </section>

            <section className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
              <StaffSurface className="flex h-full min-h-[18rem] flex-col gap-3 overflow-hidden p-5">
                <SectionTitle
                  title={t('recent_falls', 'Recent falls')}
                  description={t(
                    'recent_falls_desc',
                    'Camera and watch fall signals from your household.'
                  )}
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => router.push('/dashboard/fall-reports')}
                    >
                      {t('view_all', 'View all')}
                      <ArrowRight className="ms-1 h-3.5 w-3.5 rtl:-scale-x-100" />
                    </Button>
                  }
                />
                {recentFalls.length === 0 ? (
                  <p className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
                    {t('no_recent_falls', 'No recent fall events.')}
                  </p>
                ) : (
                  <ul className="divide-y divide-border overflow-y-auto rounded-xl border border-border">
                    {recentFalls.map((f) => {
                      const routes = f.patient
                        ? staffPatientRoutes(
                            user?.role,
                            patientPublicRef(f.patient)
                          )
                        : null;
                      return (
                        <li key={f.vision_data_id}>
                          <button
                            type="button"
                            className="flex w-full items-center gap-3 px-3.5 py-3 text-start transition-colors hover:bg-muted/40"
                            onClick={() =>
                              router.push(
                                routes?.detailRoute || '/dashboard/fall-reports'
                              )
                            }
                          >
                            <Camera className="h-4 w-4 shrink-0 text-primary" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {f.displayName}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {formatWhen(f.timestamp)}
                                {typeof f.confidence === 'number'
                                  ? ` · ${Math.round(f.confidence * 100)}%`
                                  : ''}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </StaffSurface>

              <StaffSurface className="flex h-full min-h-[18rem] flex-col gap-3 overflow-hidden p-5">
                <SectionTitle
                  title={t('meds_due', 'Meds due')}
                  description={t(
                    'meds_due_desc',
                    'Pending doses waiting for a taken / missed response.'
                  )}
                  action={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => router.push('/dashboard/patient-alert')}
                    >
                      {t('alerts', 'Alerts')}
                      <ArrowRight className="ms-1 h-3.5 w-3.5 rtl:-scale-x-100" />
                    </Button>
                  }
                />
                {pendingDoses.isLoading ? (
                  <div className="h-32 animate-pulse rounded-xl bg-muted/50" />
                ) : medsDue.length === 0 ? (
                  <p className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
                    {t('no_meds_due', 'No pending medication doses.')}
                  </p>
                ) : (
                  <ul className="divide-y divide-border overflow-y-auto rounded-xl border border-border">
                    {medsDue.map((d) => (
                      <li key={d.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 px-3.5 py-3 text-start transition-colors hover:bg-muted/40"
                          onClick={() =>
                            router.push(
                              d.alert_id
                                ? '/dashboard/patient-alert'
                                : '/dashboard/my-patients'
                            )
                          }
                        >
                          <Pill className="h-4 w-4 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {d.medication_name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {d.medication_dosage}
                              {d.scheduled_local
                                ? ` · ${d.scheduled_local}`
                                : ` · ${formatWhen(d.scheduled_at)}`}
                            </p>
                          </div>
                          <span className="text-[10px] font-medium uppercase tracking-wide text-destructive">
                            {t('pending', 'Pending')}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </StaffSurface>

              <StaffSurface className="flex h-full min-h-[18rem] flex-col gap-2 overflow-hidden p-5">
                <SectionTitle
                  title={t('fast_access', 'Fast access')}
                  description={t(
                    'fast_access_desc',
                    'Jump to the tools you use every day.'
                  )}
                />
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pe-1">
                  <StaffQuickAction
                    label={t('my_household', 'My Household')}
                    description={t(
                      'manage_household',
                      'View and manage people you care for'
                    )}
                    icon={Users}
                    onClick={() => router.push('/dashboard/my-patients')}
                  />
                  <StaffQuickAction
                    label={t('patient_alerts', 'Patient Alerts')}
                    description={t(
                      'review_clinical_alerts',
                      'Review clinical alerts'
                    )}
                    icon={ShieldAlert}
                    onClick={() => router.push('/dashboard/patient-alert')}
                  />
                  <StaffQuickAction
                    label={t('fall_reports', 'Fall reports')}
                    description={t(
                      'review_fall_events',
                      'Review fall detection events'
                    )}
                    icon={Camera}
                    onClick={() => router.push('/dashboard/fall-reports')}
                  />
                  <StaffQuickAction
                    label={t('appointments', 'Appointments')}
                    description={t(
                      'manage_schedule',
                      'Manage visits and availability'
                    )}
                    icon={CalendarDays}
                    onClick={() => router.push('/dashboard/appointments')}
                  />
                  <StaffQuickAction
                    label={t('ai_chat', 'AI Chat')}
                    description={t(
                      'ai_assistant_description',
                      'Ask the AI health assistant'
                    )}
                    icon={Brain}
                    onClick={() => router.push('/dashboard/ai')}
                  />
                  <StaffQuickAction
                    label={t('chat', 'Chat')}
                    description={t(
                      'contact_patients',
                      'Contact and message patients'
                    )}
                    icon={MessageCircle}
                    onClick={() => router.push('/dashboard/chat')}
                  />
                </div>
              </StaffSurface>
            </section>
          </>
        )}
      </div>
    </PageContainer>
  );
}
