'use client';

import { FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  AppointmentStatus,
  AppointmentSummary,
} from '../api/use-appointments';

const STATUS_DOT: Record<AppointmentStatus, string> = {
  requested: 'bg-amber-500',
  confirmed: 'bg-emerald-500',
  completed: 'bg-blue-500',
  cancelled: 'bg-rose-500',
  no_show: 'bg-zinc-400',
};

const STATUS_PILL: Record<AppointmentStatus, string> = {
  requested:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  confirmed:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  no_show: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

function dayKey(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

type Props = {
  appointments: AppointmentSummary[];
  role: string;
  onStatusChange?: (id: number, status: AppointmentStatus) => void;
};

const AppointmentsCalendar: FC<Props> = ({
  appointments,
  role,
  onStatusChange,
}) => {
  const { t, i18n } = useTranslation();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date>(() => new Date());

  const byDay = useMemo(() => {
    const map = new Map<string, AppointmentSummary[]>();
    for (const appt of appointments) {
      const key = dayKey(new Date(appt.scheduled_at));
      const list = map.get(key) ?? [];
      list.push(appt);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime(),
      );
    }
    return map;
  }, [appointments]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const selectedKey = dayKey(selected);
  const selectedAppts = byDay.get(selectedKey) ?? [];
  const canManage =
    role === 'doctor' || role === 'clinic_admin' || role === 'admin';

  const weekdays = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d.toLocaleDateString(i18n.language, { weekday: 'short' });
    });
  }, [i18n.language]);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="rounded-2xl border border-zinc-200/80 bg-white/60 p-3 dark:border-zinc-800/80 dark:bg-zinc-950/40 xl:col-span-8">
        <div className="mb-3 flex items-center justify-between gap-2 px-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full"
            onClick={() => setMonth((m) => subMonths(m, 1))}
            aria-label={t('previous_month', 'Previous month')}
          >
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
          <div className="text-center">
            <p className="text-base font-bold tracking-tight">
              {month.toLocaleDateString(i18n.language, {
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={() => {
                const today = new Date();
                setMonth(startOfMonth(today));
                setSelected(today);
              }}
            >
              {t('today', 'Today')}
            </Button>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label={t('next_month', 'Next month')}
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1">
          {weekdays.map((label) => (
            <div
              key={label}
              className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = dayKey(day);
            const dayAppts = byDay.get(key) ?? [];
            const inMonth = isSameMonth(day, month);
            const selectedDay = isSameDay(day, selected);
            const today = isToday(day);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(day)}
                className={cn(
                  'flex min-h-[4.5rem] flex-col rounded-xl border p-1.5 text-start transition',
                  inMonth
                    ? 'border-transparent bg-background/70 hover:border-primary/30'
                    : 'border-transparent bg-transparent text-muted-foreground/50',
                  selectedDay && 'border-primary/50 bg-primary/5 ring-1 ring-primary/30',
                  today && !selectedDay && 'border-dashed border-primary/40',
                )}
              >
                <span
                  className={cn(
                    'mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ltr-nums',
                    today && 'bg-primary text-primary-foreground',
                  )}
                >
                  {format(day, 'd')}
                </span>
                <div className="mt-auto flex flex-wrap gap-0.5">
                  {dayAppts.slice(0, 3).map((appt) => (
                    <span
                      key={appt.id}
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        STATUS_DOT[appt.status],
                      )}
                    />
                  ))}
                  {dayAppts.length > 3 && (
                    <span className="text-[9px] font-bold text-muted-foreground ltr-nums">
                      +{dayAppts.length - 3}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-3 px-1 text-[10px] text-muted-foreground">
          {(
            [
              'requested',
              'confirmed',
              'completed',
              'cancelled',
              'no_show',
            ] as AppointmentStatus[]
          ).map((status) => (
            <span key={status} className="inline-flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', STATUS_DOT[status])} />
              {t(`appointment_status_${status}`, status)}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white/60 p-4 dark:border-zinc-800/80 dark:bg-zinc-950/40 xl:col-span-4">
        <div className="mb-3">
          <h3 className="text-sm font-bold tracking-tight">
            {selected.toLocaleDateString(i18n.language, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t('appointments_on_day', '{{count}} appointment(s)', {
              count: selectedAppts.length,
            })}
          </p>
        </div>

        {selectedAppts.length === 0 ? (
          <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            {t('no_appointments_this_day', 'No appointments on this day.')}
          </p>
        ) : (
          <div className="space-y-2">
            {selectedAppts.map((appt) => (
              <div
                key={appt.id}
                className="rounded-xl border border-zinc-200/80 bg-background/80 p-3 dark:border-zinc-800/80"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span className="ltr-nums">
                        {formatTime(appt.scheduled_at)}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {appt.duration_minutes} min
                      {appt.reason ? ` · ${appt.reason}` : ''}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground ltr-nums">
                      {t('patient_id', 'Patient')} #{appt.patient_id}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn('rounded-full', STATUS_PILL[appt.status])}
                  >
                    {t(`appointment_status_${appt.status}`, appt.status)}
                  </Badge>
                </div>

                {canManage && onStatusChange && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {appt.status === 'requested' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 rounded-full px-2 text-[11px]"
                        onClick={() => onStatusChange(appt.id, 'confirmed')}
                      >
                        {t('confirm', 'Confirm')}
                      </Button>
                    )}
                    {appt.status === 'confirmed' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 rounded-full px-2 text-[11px]"
                          onClick={() => onStatusChange(appt.id, 'completed')}
                        >
                          {t('complete', 'Complete')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 rounded-full px-2 text-[11px]"
                          onClick={() => onStatusChange(appt.id, 'no_show')}
                        >
                          {t('no_show', 'No-show')}
                        </Button>
                      </>
                    )}
                    {(appt.status === 'requested' ||
                      appt.status === 'confirmed') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 rounded-full px-2 text-[11px] text-rose-600"
                        onClick={() => onStatusChange(appt.id, 'cancelled')}
                      >
                        {t('cancel', 'Cancel')}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsCalendar;
