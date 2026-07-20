'use client';

import { FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  AppointmentStatus,
  AppointmentSummary,
} from '../api/use-appointments';

type CalendarRange = 'day' | 'week' | 'month';

const HOUR_START = 7;
const HOUR_END = 20;
const HOUR_HEIGHT = 56;
const HOURS = Array.from(
  { length: HOUR_END - HOUR_START + 1 },
  (_, i) => HOUR_START + i,
);
const GRID_HEIGHT = (HOUR_END - HOUR_START) * HOUR_HEIGHT;

const STATUS_DOT: Record<AppointmentStatus, string> = {
  requested: 'bg-amber-500',
  confirmed: 'bg-emerald-500',
  completed: 'bg-blue-500',
  cancelled: 'bg-rose-500',
  no_show: 'bg-zinc-400',
};

const STATUS_BLOCK: Record<AppointmentStatus, string> = {
  requested:
    'border-amber-400/60 bg-amber-100/90 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100',
  confirmed:
    'border-emerald-400/60 bg-emerald-100/90 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100',
  completed:
    'border-blue-400/60 bg-blue-100/90 text-blue-900 dark:bg-blue-900/50 dark:text-blue-100',
  cancelled:
    'border-rose-400/60 bg-rose-100/80 text-rose-900 opacity-70 dark:bg-rose-900/40 dark:text-rose-100',
  no_show:
    'border-zinc-400/60 bg-zinc-100/90 text-zinc-800 opacity-70 dark:bg-zinc-800/50 dark:text-zinc-200',
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

function minutesFromMidnight(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

function apptTopPx(appt: AppointmentSummary) {
  const start = new Date(appt.scheduled_at);
  const mins = minutesFromMidnight(start) - HOUR_START * 60;
  return Math.max(0, (mins / 60) * HOUR_HEIGHT);
}

function apptHeightPx(appt: AppointmentSummary) {
  const duration = Math.max(appt.duration_minutes || 30, 15);
  return Math.max((duration / 60) * HOUR_HEIGHT, 28);
}

/** Pack overlapping appointments into columns so hours stay readable. */
function layoutDay(appts: AppointmentSummary[]) {
  const sorted = [...appts].sort(
    (a, b) =>
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
  );
  type Laid = {
    appt: AppointmentSummary;
    col: number;
    cols: number;
    start: number;
    end: number;
  };
  const laid: Laid[] = [];
  const active: { end: number; col: number }[] = [];

  for (const appt of sorted) {
    const start = minutesFromMidnight(new Date(appt.scheduled_at));
    const end = start + Math.max(appt.duration_minutes || 30, 15);
    for (let i = active.length - 1; i >= 0; i -= 1) {
      if (active[i].end <= start) active.splice(i, 1);
    }
    const used = new Set(active.map((a) => a.col));
    let col = 0;
    while (used.has(col)) col += 1;
    active.push({ end, col });
    laid.push({ appt, col, cols: 1, start, end });
  }

  // Widen each cluster so columns share the day evenly.
  for (let i = 0; i < laid.length; i += 1) {
    let clusterMax = laid[i].col + 1;
    for (let j = 0; j < laid.length; j += 1) {
      if (laid[i].start < laid[j].end && laid[j].start < laid[i].end) {
        clusterMax = Math.max(clusterMax, laid[j].col + 1);
      }
    }
    laid[i].cols = clusterMax;
  }

  return laid;
}

type Props = {
  appointments: AppointmentSummary[];
  role: string;
  onStatusChange?: (id: number, status: AppointmentStatus) => void;
  onRequestComplete?: (appt: AppointmentSummary) => void;
};

const AppointmentsCalendar: FC<Props> = ({
  appointments,
  role,
  onStatusChange,
  onRequestComplete,
}) => {
  const { t, i18n } = useTranslation();
  const [range, setRange] = useState<CalendarRange>('week');
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [selected, setSelected] = useState<Date>(() => startOfDay(new Date()));
  const [selectedApptId, setSelectedApptId] = useState<number | null>(null);

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

  const monthDays = useMemo(() => {
    const month = startOfMonth(cursor);
    const start = startOfWeek(month, { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor, { weekStartsOn: 0 });
    const end = endOfWeek(cursor, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const timelineDays = range === 'day' ? [selected] : weekDays;

  const selectedKey = dayKey(selected);
  const selectedAppts = byDay.get(selectedKey) ?? [];
  const selectedAppt =
    selectedApptId != null
      ? (appointments.find((a) => a.id === selectedApptId) ?? null)
      : null;
  const detailAppts = selectedAppt ? [selectedAppt] : selectedAppts;

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

  const title = useMemo(() => {
    if (range === 'day') {
      return selected.toLocaleDateString(i18n.language, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
    if (range === 'week') {
      const start = startOfWeek(cursor, { weekStartsOn: 0 });
      const end = endOfWeek(cursor, { weekStartsOn: 0 });
      return `${start.toLocaleDateString(i18n.language, {
        month: 'short',
        day: 'numeric',
      })} – ${end.toLocaleDateString(i18n.language, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;
    }
    return startOfMonth(cursor).toLocaleDateString(i18n.language, {
      month: 'long',
      year: 'numeric',
    });
  }, [range, cursor, selected, i18n.language]);

  const goPrev = () => {
    if (range === 'day') {
      const next = subDays(selected, 1);
      setSelected(next);
      setCursor(next);
      setSelectedApptId(null);
    } else if (range === 'week') {
      const next = subWeeks(cursor, 1);
      setCursor(next);
      setSelected(startOfWeek(next, { weekStartsOn: 0 }));
      setSelectedApptId(null);
    } else {
      setCursor((c) => subMonths(c, 1));
    }
  };

  const goNext = () => {
    if (range === 'day') {
      const next = addDays(selected, 1);
      setSelected(next);
      setCursor(next);
      setSelectedApptId(null);
    } else if (range === 'week') {
      const next = addWeeks(cursor, 1);
      setCursor(next);
      setSelected(startOfWeek(next, { weekStartsOn: 0 }));
      setSelectedApptId(null);
    } else {
      setCursor((c) => addMonths(c, 1));
    }
  };

  const goToday = () => {
    const today = startOfDay(new Date());
    setCursor(today);
    setSelected(today);
    setSelectedApptId(null);
  };

  const setRangeMode = (next: CalendarRange) => {
    setRange(next);
    setSelectedApptId(null);
    if (next === 'day') {
      setCursor(selected);
    } else if (next === 'week') {
      setCursor(selected);
    } else {
      setCursor(startOfMonth(selected));
    }
  };

  const nowLineTop = useMemo(() => {
    const now = new Date();
    const mins = minutesFromMidnight(now) - HOUR_START * 60;
    if (mins < 0 || mins > (HOUR_END - HOUR_START) * 60) return null;
    return (mins / 60) * HOUR_HEIGHT;
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="rounded-2xl border border-zinc-200/80 bg-white/60 p-3 dark:border-zinc-800/80 dark:bg-zinc-950/40 xl:col-span-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full"
              onClick={goPrev}
              aria-label={t('previous', 'Previous')}
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full"
              onClick={goNext}
              aria-label={t('next', 'Next')}
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ms-1 h-8 rounded-full px-3 text-xs"
              onClick={goToday}
            >
              {t('today', 'Today')}
            </Button>
          </div>

          <p className="text-center text-sm font-bold tracking-tight sm:text-base">
            {title}
          </p>

          <div className="flex rounded-full bg-muted p-0.5">
            {(['day', 'week', 'month'] as CalendarRange[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setRangeMode(mode)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-[11px] font-semibold transition sm:px-3',
                  range === mode
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(`calendar_range_${mode}`, mode)}
              </button>
            ))}
          </div>
        </div>

        {range === 'month' ? (
          <>
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
              {monthDays.map((day) => {
                const key = dayKey(day);
                const dayAppts = byDay.get(key) ?? [];
                const inMonth = isSameMonth(day, cursor);
                const selectedDay = isSameDay(day, selected);
                const today = isToday(day);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelected(day);
                      setSelectedApptId(null);
                      setCursor(day);
                    }}
                    onDoubleClick={() => {
                      setSelected(day);
                      setCursor(day);
                      setRange('day');
                      setSelectedApptId(null);
                    }}
                    className={cn(
                      'flex min-h-[4.5rem] flex-col rounded-xl border p-1.5 text-start transition',
                      inMonth
                        ? 'border-transparent bg-background/70 hover:border-primary/30'
                        : 'border-transparent bg-transparent text-muted-foreground/50',
                      selectedDay &&
                        'border-primary/50 bg-primary/5 ring-1 ring-primary/30',
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
          </>
        ) : (
          <div className="overflow-x-auto">
            <div
              className={cn(
                'min-w-[640px]',
                range === 'day' && 'min-w-0',
              )}
            >
              <div
                className="mb-1 grid gap-px"
                style={{
                  gridTemplateColumns: `3.5rem repeat(${timelineDays.length}, minmax(0, 1fr))`,
                }}
              >
                <div />
                {timelineDays.map((day) => {
                  const today = isToday(day);
                  const selectedDay = isSameDay(day, selected);
                  return (
                    <button
                      key={dayKey(day)}
                      type="button"
                      onClick={() => {
                        setSelected(day);
                        setSelectedApptId(null);
                        if (range === 'week') setCursor(day);
                      }}
                      className={cn(
                        'rounded-lg px-1 py-1.5 text-center transition',
                        selectedDay && 'bg-primary/5',
                      )}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {day.toLocaleDateString(i18n.language, {
                          weekday: 'short',
                        })}
                      </p>
                      <p
                        className={cn(
                          'mx-auto mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ltr-nums',
                          today && 'bg-primary text-primary-foreground',
                        )}
                      >
                        {format(day, 'd')}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div
                className="relative grid gap-px"
                style={{
                  gridTemplateColumns: `3.5rem repeat(${timelineDays.length}, minmax(0, 1fr))`,
                }}
              >
                <div className="relative" style={{ height: GRID_HEIGHT }}>
                  {HOURS.slice(0, -1).map((hour) => (
                    <div
                      key={hour}
                      className="absolute end-1 -translate-y-1/2 text-[10px] font-medium text-muted-foreground ltr-nums"
                      style={{ top: (hour - HOUR_START) * HOUR_HEIGHT }}
                    >
                      {`${String(hour).padStart(2, '0')}:00`}
                    </div>
                  ))}
                </div>

                {timelineDays.map((day) => {
                  const key = dayKey(day);
                  const dayAppts = byDay.get(key) ?? [];
                  const laid = layoutDay(dayAppts);
                  const showNow =
                    isToday(day) && nowLineTop != null;
                  return (
                    <div
                      key={key}
                      className={cn(
                        'relative border-s border-zinc-200/70 dark:border-zinc-800/70',
                        isSameDay(day, selected) && 'bg-primary/[0.03]',
                      )}
                      style={{ height: GRID_HEIGHT }}
                      onClick={() => {
                        setSelected(day);
                        setSelectedApptId(null);
                      }}
                    >
                      {HOURS.slice(0, -1).map((hour) => (
                        <div
                          key={hour}
                          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-zinc-200/80 dark:border-zinc-800/80"
                          style={{ top: (hour - HOUR_START) * HOUR_HEIGHT }}
                        />
                      ))}

                      {showNow && (
                        <div
                          className="pointer-events-none absolute inset-x-0 z-20 border-t-2 border-rose-500"
                          style={{ top: nowLineTop }}
                        >
                          <span className="absolute -start-1 -top-1.5 h-3 w-3 rounded-full bg-rose-500" />
                        </div>
                      )}

                      {laid.map(({ appt, col, cols }) => {
                        const top = apptTopPx(appt);
                        const height = Math.min(
                          apptHeightPx(appt),
                          GRID_HEIGHT - top,
                        );
                        const widthPct = 100 / cols;
                        const leftPct = col * widthPct;
                        const active = selectedApptId === appt.id;
                        return (
                          <button
                            key={appt.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(day);
                              setSelectedApptId(appt.id);
                            }}
                            className={cn(
                              'absolute z-10 overflow-hidden rounded-md border px-1.5 py-1 text-start shadow-sm transition hover:brightness-95',
                              STATUS_BLOCK[appt.status],
                              active && 'ring-2 ring-primary ring-offset-1',
                            )}
                            style={{
                              top,
                              height,
                              left: `calc(${leftPct}% + 2px)`,
                              width: `calc(${widthPct}% - 4px)`,
                            }}
                            title={`${formatTime(appt.scheduled_at)} · ${appt.duration_minutes} min`}
                          >
                            <p className="truncate text-[10px] font-bold leading-tight ltr-nums">
                              {formatTime(appt.scheduled_at)}
                            </p>
                            {height >= 40 && (
                              <p className="mt-0.5 truncate text-[10px] leading-tight opacity-90">
                                {appt.reason ||
                                  (canManage
                                    ? `${t('patient_id', 'Patient')} #${appt.patient_id}`
                                    : t('appointment', 'Appointment'))}
                              </p>
                            )}
                            {height >= 56 && range === 'day' && (
                              <p className="mt-0.5 truncate text-[9px] opacity-75 ltr-nums">
                                {appt.duration_minutes} min
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

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
            {selectedAppt
              ? t('appointment_details', 'Appointment details')
              : selected.toLocaleDateString(i18n.language, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
          </h3>
          <p className="text-xs text-muted-foreground">
            {selectedAppt
              ? formatTime(selectedAppt.scheduled_at)
              : t('appointments_on_day', '{{count}} appointment(s)', {
                  count: selectedAppts.length,
                })}
          </p>
          {selectedAppt && (
            <Button
              type="button"
              variant="link"
              className="mt-1 h-auto p-0 text-xs"
              onClick={() => setSelectedApptId(null)}
            >
              {t('show_day_appointments', 'Show all for this day')}
            </Button>
          )}
        </div>

        {detailAppts.length === 0 ? (
          <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            {t('no_appointments_this_day', 'No appointments on this day.')}
          </p>
        ) : (
          <div className="space-y-2">
            {detailAppts.map((appt) => (
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
                    {canManage && (
                      <p className="mt-1 text-[11px] text-muted-foreground ltr-nums">
                        {t('patient_id', 'Patient')} #{appt.patient_id}
                      </p>
                    )}
                    {appt.status === 'confirmed' && appt.video_room_url && (
                      <a
                        href={appt.video_room_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex text-xs font-semibold text-primary underline-offset-2 hover:underline"
                      >
                        {t('join_visit', 'Join visit')}
                      </a>
                    )}
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
                          onClick={() =>
                            onRequestComplete
                              ? onRequestComplete(appt)
                              : onStatusChange?.(appt.id, 'completed')
                          }
                        >
                          {t('complete', 'Complete')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 rounded-full px-2 text-[11px]"
                          onClick={() => onStatusChange?.(appt.id, 'no_show')}
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
