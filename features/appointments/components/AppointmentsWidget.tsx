'use client';

import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, ArrowRight, Loader2, Calendar } from 'lucide-react';
import { useDoctorWidget } from '../../appointments/api/use-appointments';

const AppointmentsWidget: FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError } = useDoctorWidget();

  if (isLoading) {
    return (
      <Card className="rounded-3xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="rounded-3xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-primary" />
            {t('appointments', 'Appointments')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('failed_load_appointments', 'Failed to load appointments')}
          </p>
        </CardContent>
      </Card>
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
    <Card className="rounded-3xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-primary" />
            {t('appointments', 'Appointments')}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/appointments')}
          >
            {t('view_all', 'View all')}
            <ArrowRight className="ms-1 h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <StatPill
            label={t('today_appointments', 'Today')}
            value={data.today_count}
            color="text-blue-600 dark:text-blue-400"
          />
          <StatPill
            label={t('this_week', 'This week')}
            value={data.week_count}
            color="text-emerald-600 dark:text-emerald-400"
          />
          <StatPill
            label={t('pending_confirmation', 'Pending')}
            value={data.pending_count}
            color="text-amber-600 dark:text-amber-400"
          />
        </div>
        {next ? (
          <div className="rounded-xl border p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {t('next_appointment', 'Next appointment')}
            </div>
            <p className="mt-1 text-sm">{formatTime(next.scheduled_at)}</p>
            <p className="text-xs text-muted-foreground">
              {next.duration_minutes} min{next.reason ? ` · ${next.reason}` : ''}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border p-3 text-center text-sm text-muted-foreground">
            {t('no_appointments', 'No appointments scheduled')}
          </div>
        )}
        {data.upcoming.length > 1 && (
          <div className="space-y-1">
            {data.upcoming.slice(1, 4).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-1.5 text-sm">
                <span className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  {formatTime(a.scheduled_at)}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {t(`appointment_status_${a.status}`, a.status)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const StatPill: FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="rounded-xl border bg-muted/30 p-2 text-center">
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);

export default AppointmentsWidget;
