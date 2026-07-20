'use client';

import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, ArrowRight, Loader2, Calendar } from 'lucide-react';
import { useDoctorWidget } from '../../appointments/api/use-appointments';
import { StaffSurface } from '@/features/patients-list/components/staff-ui';
import { cn } from '@/lib/utils';

const AppointmentsWidget: FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError } = useDoctorWidget();

  if (isLoading) {
    return (
      <StaffSurface className="flex h-full min-h-[28rem] items-center justify-center p-5">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </StaffSurface>
    );
  }

  if (isError || !data) {
    return (
      <StaffSurface className="flex h-full min-h-[28rem] flex-col gap-3 p-5">
        <div className="flex items-center gap-2 text-base font-semibold">
          <CalendarDays className="h-5 w-5 text-primary" />
          {t('appointments', 'Appointments')}
        </div>
        <p className="text-sm text-muted-foreground">
          {t('failed_load_appointments', 'Failed to load appointments')}
        </p>
      </StaffSurface>
    );
  }

  const next = data.upcoming[0];

  const formatTime = (iso: string) => {
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
  };

  return (
    <StaffSurface className="flex h-full min-h-[28rem] flex-col gap-3 overflow-hidden p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <CalendarDays className="h-5 w-5 text-primary" />
          {t('appointments', 'Appointments')}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => router.push('/dashboard/appointments')}
        >
          {t('view_all', 'View all')}
          <ArrowRight className="ms-1 h-3.5 w-3.5 rtl:-scale-x-100" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatPill
          label={t('today_appointments', 'Today')}
          value={data.today_count}
          tone="primary"
        />
        <StatPill
          label={t('this_week', 'This week')}
          value={data.week_count}
          tone="success"
        />
        <StatPill
          label={t('pending_confirmation', 'Pending')}
          value={data.pending_count}
          tone="warn"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pe-1">
        {next ? (
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {t('next_appointment', 'Next appointment')}
            </div>
            <p className="mt-1 text-sm tabular-nums">
              {formatTime(next.scheduled_at)}
            </p>
            <p className="text-xs text-muted-foreground">
              {next.duration_minutes} min
              {next.reason ? ` · ${next.reason}` : ''}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-3 text-center text-sm text-muted-foreground">
            {t('no_appointments', 'No appointments scheduled')}
          </div>
        )}

        {data.upcoming.slice(1, 5).map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate tabular-nums">
                {formatTime(a.scheduled_at)}
              </span>
            </span>
            <Badge variant="secondary" className="ms-2 shrink-0 text-xs">
              {t(`appointment_status_${a.status}`, a.status)}
            </Badge>
          </div>
        ))}
      </div>
    </StaffSurface>
  );
};

const StatPill: FC<{
  label: string;
  value: number;
  tone: 'primary' | 'success' | 'warn';
}> = ({ label, value, tone }) => (
  <div className="rounded-xl border border-border bg-muted/30 p-2.5 text-center">
    <div
      className={cn(
        'text-2xl font-semibold tabular-nums tracking-tight',
        tone === 'primary' && 'text-primary',
        tone === 'success' && 'text-emerald-600 dark:text-emerald-400',
        tone === 'warn' && 'text-amber-600 dark:text-amber-400',
      )}
    >
      {value}
    </div>
    <div className="text-[11px] text-muted-foreground">{label}</div>
  </div>
);

export default AppointmentsWidget;
