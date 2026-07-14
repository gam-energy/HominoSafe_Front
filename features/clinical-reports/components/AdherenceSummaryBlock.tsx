'use client';

import { useTranslation } from 'react-i18next';
import { Pill, CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { ClinicalReportAdherenceBreakdown } from '../types/reports';

const Stat = ({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: string;
}) => (
  <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
    <span className={tone}>{icon}</span>
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-bold ltr-nums">{value}</p>
    </div>
  </div>
);

export function AdherenceSummaryBlock({
  summary,
}: {
  summary: ClinicalReportAdherenceBreakdown | undefined;
}) {
  const { t } = useTranslation();
  if (!summary || !summary.total_doses) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('no_adherence_today', 'No medication doses scheduled yet today.')}
      </p>
    );
  }
  const rate =
    typeof summary.on_time_rate_percent === 'number'
      ? `${summary.on_time_rate_percent}%`
      : '—';
  const missed = summary.missed_medication_names ?? [];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat
          icon={<CheckCircle2 className="h-4 w-4" />}
          label={t('taken', 'Taken')}
          value={summary.taken ?? 0}
          tone="text-emerald-600 dark:text-emerald-400"
        />
        <Stat
          icon={<Clock className="h-4 w-4" />}
          label={t('late', 'Late')}
          value={summary.late ?? 0}
          tone="text-amber-600 dark:text-amber-400"
        />
        <Stat
          icon={<XCircle className="h-4 w-4" />}
          label={t('missed', 'Missed')}
          value={summary.missed ?? 0}
          tone="text-rose-600 dark:text-rose-400"
        />
        <Stat
          icon={<Pill className="h-4 w-4" />}
          label={t('pending', 'Pending')}
          value={summary.pending ?? 0}
          tone="text-sky-600 dark:text-sky-400"
        />
      </div>
      <p className="text-xs text-muted-foreground ltr-nums">
        {t('on_time_rate', 'On-time rate')}: <span className="font-semibold">{rate}</span>{' '}
        · {t('total_doses', 'Total')}: {summary.total_doses}
      </p>
      {missed.length > 0 && (
        <p className="text-xs text-rose-700 dark:text-rose-300">
          {t('missed_medications', 'Missed/pending')}: {missed.join(', ')}
        </p>
      )}
    </div>
  );
}
