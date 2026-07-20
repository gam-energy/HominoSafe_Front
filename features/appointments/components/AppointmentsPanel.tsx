'use client';

import { FC, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CalendarDays,
  Clock,
  Plus,
  Stethoscope,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  LayoutList,
  Columns3,
  History,
  Video,
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import {
  useMyAppointments,
  useSlots,
  useCreateSlot,
  useCreateAppointment,
  useUpdateAppointment,
  useCancelSlot,
  type AppointmentStatus,
  type AppointmentSummary,
  type AppointmentSlot,
} from '../api/use-appointments';
import AppointmentsKanban from './AppointmentsKanban';
import AppointmentsCalendar from './AppointmentsCalendar';
import { cn } from '@/lib/utils';

type Role = 'patient' | 'caregiver' | 'doctor' | 'clinic_admin' | 'admin';
type ViewMode = 'list' | 'history' | 'calendar' | 'kanban';
type StatusFilter = AppointmentStatus | 'all';

interface AppointmentsPanelProps {
  role: Role;
}

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  requested: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  no_show: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

const HISTORY_STATUSES: StatusFilter[] = [
  'all',
  'completed',
  'cancelled',
  'no_show',
  'confirmed',
  'requested',
];

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const AppointmentsPanel: FC<AppointmentsPanelProps> = ({ role }) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [slotOpen, setSlotOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [historyStatus, setHistoryStatus] = useState<StatusFilter>('all');

  const canManageBoard =
    role === 'doctor' || role === 'clinic_admin' || role === 'admin';

  const myAppointments = useMyAppointments(
    viewMode === 'list'
      ? { upcomingOnly: true }
      : viewMode === 'history'
        ? {
            pastOnly: true,
            status: historyStatus,
            limit: 200,
          }
        : {},
  );
  const slots = useSlots(user?.role === 'doctor' ? { doctor_id: user.id } : undefined);
  const createAppt = useCreateAppointment();
  const updateAppt = useUpdateAppointment();
  const createSlot = useCreateSlot();
  const cancelSlot = useCancelSlot();

  const canPublishSlots = role === 'doctor' || role === 'clinic_admin' || role === 'admin';

  const appointments = useMemo(() => myAppointments.data || [], [myAppointments.data]);

  const handleStatusChange = (id: number, status: AppointmentStatus) => {
    updateAppt.mutate({ id, payload: { status } });
  };

  const cardTitle =
    viewMode === 'kanban'
      ? t('appointment_board', 'Appointment board')
      : viewMode === 'calendar'
        ? t('appointment_calendar', 'Appointment calendar')
        : viewMode === 'history'
          ? t('appointment_history', 'Appointment history')
          : t('upcoming_appointments', 'Upcoming appointments');

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('appointments', 'Appointments')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('book_appointment', 'Book and manage your appointments')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-full bg-muted p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                viewMode === 'list'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LayoutList className="h-3.5 w-3.5" />
              {t('list_view', 'List')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                viewMode === 'calendar'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {t('calendar_view', 'Calendar')}
            </button>
            {canManageBoard && (
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  viewMode === 'kanban'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Columns3 className="h-3.5 w-3.5" />
                {t('kanban_view', 'Kanban')}
              </button>
            )}
          </div>
          <Button
            type="button"
            variant={viewMode === 'history' ? 'default' : 'outline'}
            onClick={() =>
              setViewMode((prev) => (prev === 'history' ? 'list' : 'history'))
            }
          >
            <History className="me-2 h-4 w-4" />
            {t('history_view', 'History')}
          </Button>
          {canPublishSlots && (
            <Dialog open={slotOpen} onOpenChange={setSlotOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="me-2 h-4 w-4" />
                  {t('publish_slot', 'Publish slot')}
                </Button>
              </DialogTrigger>
              <SlotPublisher
                onSubmit={async (payload) => {
                  await createSlot.mutateAsync(payload);
                  setSlotOpen(false);
                }}
                loading={createSlot.isPending}
                doctorId={user?.id ?? 0}
                clinicId={user?.clinic_id ?? null}
              />
            </Dialog>
          )}
          <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="me-2 h-4 w-4" />
                {t('book_appointment', 'Book appointment')}
              </Button>
            </DialogTrigger>
            <BookingDialog
              role={role}
              currentUserId={user?.id ?? 0}
              assignedDoctorId={user?.doctor_id ?? null}
              slots={slots.data || []}
              onSubmit={async (payload) => {
                await createAppt.mutateAsync(payload);
                setBookingOpen(false);
              }}
              loading={createAppt.isPending}
            />
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                {viewMode === 'history' ? (
                  <History className="h-5 w-5" />
                ) : (
                  <CalendarDays className="h-5 w-5" />
                )}
                {cardTitle}
              </CardTitle>
              {viewMode === 'kanban' && (
                <p className="mt-1 text-sm font-normal text-muted-foreground">
                  {t(
                    'kanban_hint',
                    'Drag cards between columns to update status, or use the quick actions on each card.',
                  )}
                </p>
              )}
              {viewMode === 'calendar' && (
                <p className="mt-1 text-sm font-normal text-muted-foreground">
                  {t(
                    'calendar_hint',
                    'Use Day or Week to see hours on a timeline. Month shows status dots; double-click a day to open Day view.',
                  )}
                </p>
              )}
              {viewMode === 'history' && (
                <p className="mt-1 text-sm font-normal text-muted-foreground">
                  {t(
                    'history_hint',
                    'Past appointments, newest first. Filter by status to narrow the list.',
                  )}
                </p>
              )}
            </div>
            {viewMode === 'history' && (
              <div className="w-full sm:w-48">
                <Label htmlFor="history-status" className="sr-only">
                  {t('filter_by_status', 'Filter by status')}
                </Label>
                <Select
                  value={historyStatus}
                  onValueChange={(v) => setHistoryStatus(v as StatusFilter)}
                >
                  <SelectTrigger id="history-status">
                    <SelectValue placeholder={t('filter_by_status', 'Filter by status')} />
                  </SelectTrigger>
                  <SelectContent>
                    {HISTORY_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === 'all'
                          ? t('all_statuses', 'All statuses')
                          : t(`appointment_status_${status}`, status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {myAppointments.isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {myAppointments.isError && (
            <div className="flex items-center gap-2 py-8 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              <span>{t('failed_load_appointments', 'Failed to load appointments')}</span>
            </div>
          )}
          {!myAppointments.isLoading &&
            !myAppointments.isError &&
            viewMode === 'calendar' && (
              <AppointmentsCalendar
                appointments={appointments}
                role={role}
                onStatusChange={handleStatusChange}
              />
            )}
          {!myAppointments.isLoading &&
            !myAppointments.isError &&
            appointments.length === 0 &&
            viewMode !== 'calendar' && (
              <div className="py-8 text-center text-muted-foreground">
                {viewMode === 'history'
                  ? t('no_past_appointments', 'No past appointments yet')
                  : t('no_appointments', 'No appointments scheduled')}
              </div>
            )}
          {!myAppointments.isLoading &&
            !myAppointments.isError &&
            appointments.length > 0 &&
            viewMode === 'kanban' &&
            canManageBoard && (
              <AppointmentsKanban
                appointments={appointments}
                onStatusChange={handleStatusChange}
                pending={updateAppt.isPending}
              />
            )}
          {!myAppointments.isLoading &&
            !myAppointments.isError &&
            appointments.length > 0 &&
            (viewMode === 'list' || viewMode === 'history') && (
              <div className="space-y-3">
                {appointments.map((appt) => (
                  <AppointmentRow
                    key={appt.id}
                    appt={appt}
                    role={role}
                    onStatusChange={handleStatusChange}
                    historyMode={viewMode === 'history'}
                  />
                ))}
              </div>
            )}
        </CardContent>
      </Card>

      {canPublishSlots && slots.data && slots.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              {t('available_slots', 'Available slots')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {slots.data.map((slot) => (
                <SlotRow
                  key={slot.id}
                  slot={slot}
                  onCancel={() => cancelSlot.mutate(slot.id)}
                  loading={cancelSlot.isPending}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ---------------- Appointment Row ---------------- //

interface AppointmentRowProps {
  appt: AppointmentSummary;
  role: Role;
  onStatusChange: (id: number, status: AppointmentStatus) => void;
  historyMode?: boolean;
}

const AppointmentRow: FC<AppointmentRowProps> = ({
  appt,
  role,
  onStatusChange,
  historyMode = false,
}) => {
  const { t } = useTranslation();
  const [videoOpen, setVideoOpen] = useState(false);
  const canManage = role === 'doctor' || role === 'clinic_admin' || role === 'admin';
  const isTerminal =
    appt.status === 'cancelled' ||
    appt.status === 'completed' ||
    appt.status === 'no_show';
  const showCancel =
    !isTerminal &&
    !historyMode &&
    (canManage || role === 'patient' || role === 'caregiver');
  const showPatientLabel = canManage || role === 'caregiver';

  const copyVideoLink = async () => {
    if (!appt.video_room_url) return;
    try {
      await navigator.clipboard.writeText(appt.video_room_url);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{formatDateTime(appt.scheduled_at)}</p>
          <p className="text-sm text-muted-foreground">
            {appt.duration_minutes} min{appt.reason ? ` — ${appt.reason}` : ''}
            {showPatientLabel ? ` · ${t('patient_id', 'Patient')} #${appt.patient_id}` : ''}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={STATUS_COLORS[appt.status]} variant="secondary">
          {t(`appointment_status_${appt.status}`, appt.status)}
        </Badge>
        {appt.status === 'requested' && (role === 'patient' || role === 'caregiver') && (
          <span className="text-xs text-muted-foreground">
            {t(
              'video_after_confirm',
              'Online visit link appears after the doctor confirms.',
            )}
          </span>
        )}
        {appt.status === 'confirmed' && appt.video_room_url && (
          <>
            <Button size="sm" variant="secondary" onClick={() => setVideoOpen(true)}>
              <Video className="me-1 h-4 w-4" />
              {t('join_visit', 'Join visit')}
            </Button>
            <Dialog open={videoOpen} onOpenChange={setVideoOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('online_visit', 'Online visit')}</DialogTitle>
                </DialogHeader>
                <ol className="list-decimal space-y-2 ps-5 text-sm text-muted-foreground">
                  <li>
                    {t(
                      'online_visit_step1',
                      'Join at the appointment time (or a few minutes early).',
                    )}
                  </li>
                  <li>
                    {t(
                      'online_visit_step2',
                      'Click “Open video room”. Allow camera and microphone when the browser asks.',
                    )}
                  </li>
                  <li>
                    {t(
                      'online_visit_step3',
                      'Your doctor joins the same room with the same link — no app install needed.',
                    )}
                  </li>
                </ol>
                <p className="break-all rounded-md border bg-muted/40 p-2 text-xs">
                  {appt.video_room_url}
                </p>
                <DialogFooter className="flex-wrap gap-2 sm:justify-between">
                  <Button type="button" variant="outline" onClick={copyVideoLink}>
                    {t('copy_link', 'Copy link')}
                  </Button>
                  <Button asChild>
                    <a
                      href={appt.video_room_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Video className="me-1 h-4 w-4" />
                      {t('open_video_room', 'Open video room')}
                    </a>
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
        {canManage && appt.status === 'requested' && (
          <Button size="sm" variant="outline" onClick={() => onStatusChange(appt.id, 'confirmed')}>
            <CheckCircle className="me-1 h-4 w-4" />
            {t('confirm', 'Confirm')}
          </Button>
        )}
        {canManage && (appt.status === 'confirmed' || (historyMode && appt.status === 'requested')) && (
          <>
            <Button size="sm" variant="outline" onClick={() => onStatusChange(appt.id, 'completed')}>
              <CheckCircle className="me-1 h-4 w-4" />
              {t('complete', 'Complete')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onStatusChange(appt.id, 'no_show')}>
              {t('no_show', 'No-show')}
            </Button>
          </>
        )}
        {showCancel && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onStatusChange(appt.id, 'cancelled')}
          >
            <XCircle className="me-1 h-4 w-4" />
            {t('cancel', 'Cancel')}
          </Button>
        )}
      </div>
    </div>
  );
};

// ---------------- Slot Row ---------------- //

interface SlotRowProps {
  slot: AppointmentSlot;
  onCancel: () => void;
  loading: boolean;
}

const SlotRow: FC<SlotRowProps> = ({ slot, onCancel, loading }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="font-medium">{formatDateTime(slot.start_time)}</p>
          <p className="text-sm text-muted-foreground">
            {t('slot_staff_occupancy', '{{booked}}/{{capacity}} booked', {
              booked: slot.booked_count,
              capacity: slot.capacity,
            })}
            {' · '}
            {slot.recurrence}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={slot.status === 'open' ? 'default' : 'secondary'}>
          {t(`slot_status_${slot.status}`, slot.status)}
        </Badge>
        {slot.status !== 'cancelled' && (
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={loading}>
            <XCircle className="me-1 h-4 w-4" />
            {t('cancel', 'Cancel')}
          </Button>
        )}
      </div>
    </div>
  );
};

// ---------------- Slot Publisher ---------------- //

interface SlotPublisherProps {
  onSubmit: (payload: {
    doctor_id: number;
    clinic_id?: number | null;
    start_time: string;
    end_time: string;
    capacity?: number;
    recurrence?: 'none' | 'daily' | 'weekly';
  }) => Promise<void>;
  loading: boolean;
  doctorId: number;
  clinicId: number | null;
}

const SlotPublisher: FC<SlotPublisherProps> = ({ onSubmit, loading, doctorId, clinicId }) => {
  const { t } = useTranslation();
  const [startTime, setStartTime] = useState(formatDateInput(new Date()));
  const [endTime, setEndTime] = useState(formatDateInput(new Date(Date.now() + 30 * 60 * 1000)));
  const [capacity, setCapacity] = useState(1);
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly'>('none');

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{t('publish_slot', 'Publish slot')}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>{t('start_time', 'Start time')}</Label>
          <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <Label>{t('end_time', 'End time')}</Label>
          <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        <div>
          <Label>{t('capacity', 'Capacity')}</Label>
          <Input type="number" min={1} max={100} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
        </div>
        <div>
          <Label>{t('recurrence', 'Recurrence')}</Label>
          <Select value={recurrence} onValueChange={(v) => setRecurrence(v as 'none' | 'daily' | 'weekly')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('none', 'None')}</SelectItem>
              <SelectItem value="daily">{t('daily', 'Daily')}</SelectItem>
              <SelectItem value="weekly">{t('weekly', 'Weekly')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={() => onSubmit({
            doctor_id: doctorId,
            clinic_id: clinicId,
            start_time: new Date(startTime).toISOString(),
            end_time: new Date(endTime).toISOString(),
            capacity,
            recurrence,
          })}
          disabled={loading}
        >
          {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {t('publish', 'Publish')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

// ---------------- Booking Dialog ---------------- //

interface BookingDialogProps {
  role: Role;
  currentUserId: number;
  assignedDoctorId?: number | null;
  slots: AppointmentSlot[];
  onSubmit: (payload: {
    slot_id?: number | null;
    patient_id: number;
    doctor_id: number;
    scheduled_at: string;
    reason?: string;
  }) => Promise<void>;
  loading: boolean;
}

const BookingDialog: FC<BookingDialogProps> = ({ role, currentUserId, assignedDoctorId, slots, onSubmit, loading }) => {
  const { t } = useTranslation();
  const [slotId, setSlotId] = useState<string>('none');
  const [patientId, setPatientId] = useState<string>(role === 'patient' ? String(currentUserId) : '');
  const [doctorId, setDoctorId] = useState<string>('');
  const [scheduledAt, setScheduledAt] = useState(formatDateInput(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  const [reason, setReason] = useState('');

  // Keep patient id in sync with the logged-in user for patient role (user
  // loads asynchronously, so the initial value may be stale).
  useEffect(() => {
    if (role === 'patient' && currentUserId) {
      setPatientId(String(currentUserId));
    }
  }, [role, currentUserId]);

  // Patients book with their own assigned doctor only — never a manual entry.
  const isPatient = role === 'patient';
  const effectiveDoctorId = isPatient ? (assignedDoctorId ?? 0) : Number(doctorId);

  const openSlots = slots.filter((s) => s.status === 'open');

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{t('book_appointment', 'Book appointment')}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        {openSlots.length > 0 && (
          <div>
            <Label>{t('available_slots', 'Available slots')}</Label>
            <Select value={slotId} onValueChange={setSlotId}>
              <SelectTrigger><SelectValue placeholder={t('pick_slot', 'Pick a slot')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('no_slot_adhoc', 'No slot (ad-hoc)')}</SelectItem>
                {openSlots.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {formatDateTime(s.start_time)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {role !== 'patient' && (
          <div>
            <Label>{t('patient_id', 'Patient ID')}</Label>
            <Input value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="123" />
          </div>
        )}
        {slotId === 'none' && (
          <>
            {!isPatient && (
              <div>
                <Label>{t('doctor_id', 'Doctor ID')}</Label>
                <Input value={doctorId} onChange={(e) => setDoctorId(e.target.value)} placeholder="456" />
              </div>
            )}
            {isPatient && (
              <div className="rounded-md border bg-muted/40 p-2 text-sm text-muted-foreground">
                {assignedDoctorId
                  ? t('booking_with_assigned_doctor', 'Booking with your assigned doctor')
                  : t('no_assigned_doctor', 'You have no assigned doctor — ask your clinic to assign one.')}
              </div>
            )}
            <div>
              <Label>{t('scheduled_at', 'Scheduled at')}</Label>
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
          </>
        )}
        <div>
          <Label>{t('reason', 'Reason')}</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('reason_placeholder', 'Reason for visit')} />
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={() => {
            const slot = slotId !== 'none' ? openSlots.find((s) => String(s.id) === slotId) : null;
            const pId = Number(patientId);
            const dId = slot ? slot.doctor_id : effectiveDoctorId;
            // Guard against NaN (non-numeric input) which would serialize to
            // null and trigger a 422 from the backend.
            if (!Number.isFinite(pId) || pId <= 0) return;
            if (!slot && (!Number.isFinite(dId) || dId <= 0)) return;
            onSubmit({
              slot_id: slot ? slot.id : null,
              patient_id: pId,
              doctor_id: dId,
              scheduled_at: new Date(scheduledAt).toISOString(),
              reason: reason || undefined,
            });
          }}
          disabled={loading || !patientId || (slotId === 'none' && (!isPatient && !doctorId))}
        >
          {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {t('book', 'Book')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default AppointmentsPanel;
