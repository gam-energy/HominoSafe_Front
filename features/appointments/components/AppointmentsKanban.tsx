'use client';

import { FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  Calendar,
  CheckCircle,
  Clock,
  GripVertical,
  UserRound,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  AppointmentStatus,
  AppointmentSummary,
} from '../api/use-appointments';

const KANBAN_COLUMNS: AppointmentStatus[] = [
  'requested',
  'confirmed',
  'completed',
  'no_show',
  'cancelled',
];

const COLUMN_ACCENT: Record<AppointmentStatus, string> = {
  requested: 'border-t-amber-500',
  confirmed: 'border-t-emerald-500',
  completed: 'border-t-blue-500',
  no_show: 'border-t-zinc-400',
  cancelled: 'border-t-rose-500',
};

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  requested:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  confirmed:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  no_show: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function isAllowedMove(from: AppointmentStatus, to: AppointmentStatus): boolean {
  if (from === to) return false;
  // Terminal columns can still receive cards from active ones.
  if (from === 'completed' || from === 'cancelled') return false;
  return true;
}

type Props = {
  appointments: AppointmentSummary[];
  onStatusChange: (id: number, status: AppointmentStatus) => void;
  onRequestComplete?: (appt: AppointmentSummary) => void;
  pending?: boolean;
};

const AppointmentsKanban: FC<Props> = ({
  appointments,
  onStatusChange,
  onRequestComplete,
  pending,
}) => {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const byStatus = useMemo(() => {
    const map: Record<AppointmentStatus, AppointmentSummary[]> = {
      requested: [],
      confirmed: [],
      completed: [],
      cancelled: [],
      no_show: [],
    };
    for (const appt of appointments) {
      map[appt.status]?.push(appt);
    }
    for (const status of KANBAN_COLUMNS) {
      map[status].sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
      );
    }
    return map;
  }, [appointments]);

  const activeAppt = appointments.find((a) => a.id === activeId) ?? null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(Number(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const apptId = Number(event.active.id);
    const overId = event.over?.id;
    if (!overId) return;

    const appt = appointments.find((a) => a.id === apptId);
    if (!appt) return;

    const over = String(overId);
    const nextStatus = (
      KANBAN_COLUMNS.includes(over as AppointmentStatus)
        ? over
        : appointments.find((a) => String(a.id) === over)?.status
    ) as AppointmentStatus | undefined;

    if (!nextStatus || !isAllowedMove(appt.status, nextStatus)) return;
    if (nextStatus === 'completed' && onRequestComplete) {
      onRequestComplete(appt);
      return;
    }
    onStatusChange(apptId, nextStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {KANBAN_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            items={byStatus[status]}
            title={t(`appointment_status_${status}`, status)}
            pending={pending}
            onQuickAction={onStatusChange}
            onRequestComplete={onRequestComplete}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeAppt ? (
          <KanbanCard appt={activeAppt} dragging overlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

function KanbanColumn({
  status,
  items,
  title,
  pending,
  onQuickAction,
  onRequestComplete,
}: {
  status: AppointmentStatus;
  items: AppointmentSummary[];
  title: string;
  pending?: boolean;
  onQuickAction: (id: number, status: AppointmentStatus) => void;
  onRequestComplete?: (appt: AppointmentSummary) => void;
}) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-2xl border border-zinc-200/80 bg-muted/25 dark:border-zinc-800/80',
        'border-t-4',
        COLUMN_ACCENT[status],
        isOver && 'bg-primary/5 ring-2 ring-primary/30',
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold tracking-tight">{title}</h3>
          <Badge variant="secondary" className="rounded-full ltr-nums">
            {items.length}
          </Badge>
        </div>
      </div>

      <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto px-2 pb-3">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed px-3 py-8 text-center text-xs text-muted-foreground">
            {t('kanban_empty_column', 'Drop appointments here')}
          </p>
        ) : (
          items.map((appt) => (
            <KanbanCard
              key={appt.id}
              appt={appt}
              disabled={pending}
              onQuickAction={onQuickAction}
              onRequestComplete={onRequestComplete}
            />
          ))
        )}
      </div>
    </div>
  );
}

function KanbanCard({
  appt,
  dragging,
  overlay,
  disabled,
  onQuickAction,
  onRequestComplete,
}: {
  appt: AppointmentSummary;
  dragging?: boolean;
  overlay?: boolean;
  disabled?: boolean;
  onQuickAction?: (id: number, status: AppointmentStatus) => void;
  onRequestComplete?: (appt: AppointmentSummary) => void;
}) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: appt.id,
      disabled: disabled || overlay,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const canConfirm = appt.status === 'requested';
  const canComplete = appt.status === 'confirmed';
  const canMarkNoShow = appt.status === 'confirmed';
  const canCancel =
    appt.status === 'requested' || appt.status === 'confirmed';

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      className={cn(
        'rounded-xl border border-zinc-200/80 bg-white/90 p-3 shadow-sm backdrop-blur-md transition dark:border-zinc-800/80 dark:bg-zinc-900/80',
        (isDragging || dragging) && 'opacity-40',
        overlay && 'rotate-1 shadow-xl opacity-100',
      )}
    >
      <div className="mb-2 flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          aria-label={t('drag_appointment', 'Drag appointment')}
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="ltr-nums">{formatDateTime(appt.scheduled_at)}</span>
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {appt.duration_minutes} min
            {appt.reason ? ` · ${appt.reason}` : ''}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserRound className="h-3 w-3" />
            {t('patient_id', 'Patient')} #{appt.patient_id}
          </p>
        </div>
      </div>

      <Badge
        className={cn('mb-2 rounded-full', STATUS_COLORS[appt.status])}
        variant="secondary"
      >
        {t(`appointment_status_${appt.status}`, appt.status)}
      </Badge>

      {onQuickAction && !overlay && (
        <div className="flex flex-wrap gap-1.5">
          {canConfirm && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-full px-2 text-[11px]"
              disabled={disabled}
              onClick={() => onQuickAction(appt.id, 'confirmed')}
            >
              <CheckCircle className="me-1 h-3 w-3" />
              {t('confirm', 'Confirm')}
            </Button>
          )}
          {canComplete && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-full px-2 text-[11px]"
              disabled={disabled}
              onClick={() =>
                onRequestComplete
                  ? onRequestComplete(appt)
                  : onQuickAction?.(appt.id, 'completed')
              }
            >
              <CheckCircle className="me-1 h-3 w-3" />
              {t('complete', 'Complete')}
            </Button>
          )}
          {canMarkNoShow && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 rounded-full px-2 text-[11px]"
              disabled={disabled}
              onClick={() => onQuickAction(appt.id, 'no_show')}
            >
              {t('no_show', 'No-show')}
            </Button>
          )}
          {canCancel && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 rounded-full px-2 text-[11px] text-rose-600"
              disabled={disabled}
              onClick={() => onQuickAction(appt.id, 'cancelled')}
            >
              <XCircle className="me-1 h-3 w-3" />
              {t('cancel', 'Cancel')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default AppointmentsKanban;
