'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Search, Users } from 'lucide-react';

import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePatients } from '@/features/patients-list/api/useGetPatients';

import { AlertType } from '../types/AlertSchema';
import { useAlertWebSocket } from '../hooks/useAlertWebSocket';
import { AlertCard } from './Alert';

type AckFilter = 'all' | 'pending' | 'acknowledged';
const ALL_PATIENTS = 'all';

const DoctorAlertList: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = (i18n.language || 'en').startsWith('fa');

  const [filter, setFilter] = useState<AlertType['severity'] | 'all'>('all');
  const [ackFilter, setAckFilter] = useState<AckFilter>('all');
  const [patientFilter, setPatientFilter] = useState<string>(ALL_PATIENTS);
  const [searchQuery, setSearchQuery] = useState('');

  const { alerts: liveAlerts, status, upsertAlert } = useAlertWebSocket();
  const { data: patients = [], isLoading: patientsLoading } = usePatients(true);

  const patientNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of patients) {
      const full = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
      map.set(String(p.id), full || p.username);
    }
    return map;
  }, [patients]);

  /** Enrich alerts with patient display names from the care-team roster. */
  const alerts = useMemo(() => {
    return (liveAlerts ?? []).map((a) => ({
      ...a,
      patientName: a.patientName || patientNameById.get(a.userId) || undefined,
    }));
  }, [liveAlerts, patientNameById]);

  const handleAcknowledge = useCallback(
    (updated: AlertType) => {
      upsertAlert(updated);
    },
    [upsertAlert],
  );

  const statusMeta: Record<string, { label: string; dot: string }> = {
    connected: { label: t('live', 'Live'), dot: 'bg-emerald-500' },
    connecting: { label: t('connecting', 'Connecting...'), dot: 'bg-amber-500' },
    disconnected: { label: t('reconnecting', 'Reconnecting...'), dot: 'bg-amber-500' },
    error: { label: t('offline', 'Offline'), dot: 'bg-rose-500' },
  };

  const patientScoped = useMemo(() => {
    if (patientFilter === ALL_PATIENTS) return alerts;
    return alerts.filter((a) => a.userId === patientFilter);
  }, [alerts, patientFilter]);

  const severities = useMemo(() => {
    const counts = {
      all: patientScoped.length,
      critical: patientScoped.filter((a) => a.severity === 'critical').length,
      high: patientScoped.filter((a) => a.severity === 'high').length,
      medium: patientScoped.filter((a) => a.severity === 'medium').length,
      low: patientScoped.filter((a) => a.severity === 'low').length,
    };
    return [
      {
        id: 'all' as const,
        label: t('all', 'All'),
        count: counts.all,
        color: 'bg-primary text-primary-foreground',
        badge: 'bg-primary-foreground/20 text-primary-foreground',
        shadow: 'shadow-primary/15',
      },
      {
        id: 'critical' as const,
        label: t('critical', 'Critical'),
        count: counts.critical,
        color: 'bg-rose-500 text-white',
        badge: 'bg-white/25 text-white',
        shadow: 'shadow-rose-500/15',
      },
      {
        id: 'high' as const,
        label: t('high', 'High'),
        count: counts.high,
        color: 'bg-amber-500 text-white',
        badge: 'bg-white/25 text-white',
        shadow: 'shadow-amber-500/15',
      },
      {
        id: 'medium' as const,
        label: t('medium', 'Medium'),
        count: counts.medium,
        color: 'bg-sky-500 text-white',
        badge: 'bg-white/25 text-white',
        shadow: 'shadow-sky-500/15',
      },
      {
        id: 'low' as const,
        label: t('low', 'Low'),
        count: counts.low,
        color: 'bg-emerald-500 text-white',
        badge: 'bg-white/25 text-white',
        shadow: 'shadow-emerald-500/15',
      },
    ];
  }, [t, patientScoped]);

  const ackFilters = useMemo(() => {
    const pending = patientScoped.filter((a) => !a.isAcknowledged).length;
    const acknowledged = patientScoped.filter((a) => a.isAcknowledged).length;
    return [
      { id: 'all' as const, label: t('all_statuses', 'All statuses'), count: patientScoped.length },
      { id: 'pending' as const, label: t('pending', 'Pending'), count: pending },
      { id: 'acknowledged' as const, label: t('acknowledged', 'Acknowledged'), count: acknowledged },
    ];
  }, [t, patientScoped]);

  const filteredAlerts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return patientScoped
      .filter((alert) => {
        const matchesSeverity = filter === 'all' || alert.severity === filter;
        const matchesAck =
          ackFilter === 'all' ||
          (ackFilter === 'pending' && !alert.isAcknowledged) ||
          (ackFilter === 'acknowledged' && !!alert.isAcknowledged);
        const matchesSearch =
          !q ||
          alert.alertType.toLowerCase().includes(q) ||
          (alert.patientName || '').toLowerCase().includes(q) ||
          (alert.notes || '').toLowerCase().includes(q) ||
          (alert.message || '').toLowerCase().includes(q) ||
          (alert.sensorData?.activity || '').toLowerCase().includes(q);
        return matchesSeverity && matchesAck && matchesSearch;
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }, [patientScoped, filter, ackFilter, searchQuery]);

  const selectedPatientLabel =
    patientFilter === ALL_PATIENTS
      ? t('all_patients', 'All patients')
      : patientNameById.get(patientFilter) || t('patient', 'Patient');

  return (
    <PageContainer scrollable>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Heading
            title={t('patient_alerts', 'Patient Alerts')}
            description={t(
              'doctor_alerts_subdescription',
              'Review live clinical alerts across your patients. Filter by patient, severity, and status.',
            )}
          />
          <span className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                statusMeta[status]?.dot,
                status === 'connected' ? 'animate-pulse' : '',
              )}
            />
            {statusMeta[status]?.label}
          </span>
        </div>

        {/* Patient filter */}
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-muted-foreground" />
            {t('filter_by_patient', 'Filter by patient')}
          </div>
          <Select
            value={patientFilter}
            onValueChange={setPatientFilter}
            disabled={patientsLoading}
          >
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder={selectedPatientLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PATIENTS}>
                {t('all_patients', 'All patients')} ({alerts.length})
              </SelectItem>
              {patients.map((p) => {
                const name =
                  [p.first_name, p.last_name].filter(Boolean).join(' ').trim() ||
                  p.username;
                const count = alerts.filter((a) => a.userId === String(p.id)).length;
                return (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {name} ({count})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Severity chips — same design as patient panel */}
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
                  'flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200',
                  isSelected
                    ? `${sev.color} ${sev.shadow} border-transparent`
                    : 'border-border bg-card text-foreground hover:bg-muted/50',
                )}
              >
                <span className="truncate">{sev.label}</span>
                <span
                  className={cn(
                    'flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md px-1.5 text-xs font-bold ltr-nums',
                    isSelected ? sev.badge : 'bg-muted text-muted-foreground',
                  )}
                >
                  {sev.count}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Ack status chips */}
        <div className="flex flex-wrap gap-2">
          {ackFilters.map((chip) => {
            const selected = ackFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setAckFilter(chip.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/50',
                )}
              >
                {chip.label}
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.5 text-[10px] font-bold ltr-nums',
                    selected ? 'bg-primary-foreground/20' : 'bg-muted',
                  )}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full">
          <div
            className={cn(
              'pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground',
              isRtl ? 'right-3.5' : 'left-3.5',
            )}
          >
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(
              'search_doctor_alerts_placeholder',
              'Search by patient, alert type, notes…',
            )}
            className={cn(
              'w-full rounded-xl border border-border bg-background py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20',
              isRtl ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left',
            )}
          />
        </div>

        {/* Alert cards — shared patient-panel design */}
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
                  {patientFilter !== ALL_PATIENTS
                    ? t(
                        'no_alerts_for_patient',
                        'No alerts for this patient with the current filters.',
                      )
                    : t(
                        'no_alerts_found',
                        'No physiological alerts found matching filters.',
                      )}
                </p>
              </motion.div>
            ) : (
              filteredAlerts.map((alert) => (
                <AlertCard
                  key={alert.alertId}
                  alert={alert}
                  onAcknowledge={handleAcknowledge}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageContainer>
  );
};

export default DoctorAlertList;
