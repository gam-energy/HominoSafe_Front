'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Camera,
  HeartHandshake,
  Pill,
} from 'lucide-react';

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { usePatients } from '@/features/patients-list/api/useGetPatients';
import { staffPatientRoutes, patientPublicRef } from '@/features/patient-knowledge/utils/staffRoutes';
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
    [patients],
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

  const unsettled = useMemo(() => {
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
      })
      .slice(0, 6);
  }, [alerts, patientIds, patients]);

  const recentFalls = useMemo(() => {
    return falls
      .filter((f) => patientIds.size === 0 || patientIds.has(f.patient_id))
      .slice(0, 5)
      .map((f) => {
        const p = (patients ?? []).find((x) => x.id === f.patient_id);
        const name = p
          ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.username
          : f.patient_name || `#${f.patient_id}`;
        return { ...f, displayName: name };
      });
  }, [falls, patientIds, patients]);

  const medsDue = useMemo(
    () => (pendingDoses.data?.doses ?? []).slice(0, 6),
    [pendingDoses.data?.doses],
  );

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
            <p className="max-w-lg text-sm text-muted-foreground">
              {t(
                'caregiver_home_focus',
                'Who needs you now — unsettled people, recent falls, and meds due.',
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AddPatientButton />
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/my-patients')}
            >
              {t('my_household', 'My Household')}
              <ArrowRight className="ms-1.5 h-4 w-4 rtl:-scale-x-100" />
            </Button>
          </div>
        </header>

        {error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : null}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Unsettled */}
          <section>
            <SectionTitle
              title={t('whos_unsettled', "Who’s unsettled")}
              description={t(
                'whos_unsettled_desc',
                'People with recent medium–critical alerts.',
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
              <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                {t('household_calm', 'Everyone looks settled right now.')}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {unsettled.map(({ patient, alert }) => {
                  const routes = staffPatientRoutes(
                    user?.role,
                    patientPublicRef(patient),
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
          </section>

          {/* Recent falls */}
          <section>
            <SectionTitle
              title={t('recent_falls', 'Recent falls')}
              description={t(
                'recent_falls_desc',
                'Camera and watch fall signals from your household.',
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
              <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                {t('no_recent_falls', 'No recent fall events.')}
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {recentFalls.map((f) => (
                  <li key={f.vision_data_id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-3.5 py-3 text-start transition-colors hover:bg-muted/40"
                      onClick={() => router.push('/dashboard/fall-reports')}
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
                ))}
              </ul>
            )}
          </section>

          {/* Meds due */}
          <section>
            <SectionTitle
              title={t('meds_due', 'Meds due')}
              description={t(
                'meds_due_desc',
                'Pending doses waiting for a taken / missed response.',
              )}
            />
            {pendingDoses.isLoading ? (
              <div className="h-32 animate-pulse rounded-xl bg-muted/50" />
            ) : medsDue.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                {t('no_meds_due', 'No pending medication doses.')}
              </p>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {medsDue.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-3.5 py-3 text-start transition-colors hover:bg-muted/40"
                      onClick={() =>
                        router.push(
                          d.alert_id
                            ? '/dashboard/patient-alert'
                            : '/dashboard/my-patients',
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
          </section>
        </div>
      </div>
    </PageContainer>
  );
}
