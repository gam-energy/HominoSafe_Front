import axiosInstance from '@/api/axiosInstance';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type AppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type SlotStatus = 'open' | 'booked' | 'cancelled';
export type Recurrence = 'none' | 'daily' | 'weekly';

export interface AppointmentSlot {
  id: number;
  doctor_id: number;
  clinic_id?: number | null;
  start_time: string;
  end_time: string;
  capacity: number;
  recurrence: Recurrence;
  status: SlotStatus;
  booked_count: number;
  notes?: string | null;
  created_at: string;
}

export interface AppointmentSummary {
  id: number;
  patient_id: number;
  doctor_id: number;
  clinic_id?: number | null;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  reason?: string | null;
  video_room_url?: string | null;
}

export interface Appointment extends AppointmentSummary {
  slot_id?: number | null;
  notes?: string | null;
  created_by_id?: number | null;
  confirmed_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
}

export interface SlotCreatePayload {
  doctor_id: number;
  clinic_id?: number | null;
  start_time: string;
  end_time: string;
  capacity?: number;
  recurrence?: Recurrence;
  notes?: string | null;
}

export interface AppointmentCreatePayload {
  slot_id?: number | null;
  patient_id: number;
  doctor_id: number;
  clinic_id?: number | null;
  scheduled_at: string;
  duration_minutes?: number;
  reason?: string | null;
  notes?: string | null;
}

export interface AppointmentUpdatePayload {
  status?: AppointmentStatus;
  scheduled_at?: string;
  duration_minutes?: number;
  reason?: string | null;
  notes?: string | null;
  cancellation_reason?: string | null;
}

export interface DoctorWidgetStats {
  today_count: number;
  week_count: number;
  pending_count: number;
  upcoming: AppointmentSummary[];
}

// ---------------- Slots ---------------- //

export function useSlots(params?: {
  doctor_id?: number;
  clinic_id?: number;
  from_time?: string;
  to_time?: string;
  include_cancelled?: boolean;
}) {
  return useQuery({
    queryKey: ['slots', params],
    queryFn: async () => {
      const { data } = await axiosInstance.get<AppointmentSlot[]>('/appointments/slots', {
        params,
      });
      return data;
    },
  });
}

export function useCreateSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SlotCreatePayload) => {
      const { data } = await axiosInstance.post<AppointmentSlot>('/appointments/slots', payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['slots'] }),
  });
}

export function useUpdateSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<SlotCreatePayload> & { status?: SlotStatus } }) => {
      const { data } = await axiosInstance.patch<AppointmentSlot>(`/appointments/slots/${id}`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['slots'] }),
  });
}

export function useCancelSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await axiosInstance.delete(`/appointments/slots/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['slots'] }),
  });
}

// ---------------- Appointments ---------------- //

export function useAppointments(params?: {
  patient_id?: number;
  doctor_id?: number;
  clinic_id?: number;
  status?: AppointmentStatus;
  from_time?: string;
  to_time?: string;
}) {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: async () => {
      const { data } = await axiosInstance.get<AppointmentSummary[]>('/appointments', {
        params,
      });
      return data;
    },
  });
}

export function useAppointment(id?: number) {
  return useQuery({
    queryKey: ['appointment', id],
    enabled: typeof id === 'number',
    queryFn: async () => {
      const { data } = await axiosInstance.get<Appointment>(`/appointments/${id}`);
      return data;
    },
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AppointmentCreatePayload) => {
      const { data } = await axiosInstance.post<Appointment>('/appointments', payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['my-appointments'] });
      qc.invalidateQueries({ queryKey: ['doctor-widget'] });
    },
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: AppointmentUpdatePayload }) => {
      const { data } = await axiosInstance.patch<Appointment>(`/appointments/${id}`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['my-appointments'] });
      qc.invalidateQueries({ queryKey: ['doctor-widget'] });
    },
  });
}

// ---------------- Me ---------------- //

export interface MyAppointmentsParams {
  upcomingOnly?: boolean;
  pastOnly?: boolean;
  status?: AppointmentStatus | 'all';
  from_time?: string;
  to_time?: string;
  limit?: number;
}

export function useMyAppointments(params: MyAppointmentsParams | boolean = {}) {
  // Back-compat: older callers passed a bare `upcomingOnly` boolean.
  const normalized: MyAppointmentsParams =
    typeof params === 'boolean' ? { upcomingOnly: params } : params;

  const queryParams = {
    upcoming_only: Boolean(normalized.upcomingOnly),
    past_only: Boolean(normalized.pastOnly),
    status:
      normalized.status && normalized.status !== 'all'
        ? normalized.status
        : undefined,
    from_time: normalized.from_time,
    to_time: normalized.to_time,
    limit: normalized.limit,
  };

  return useQuery({
    queryKey: ['my-appointments', queryParams],
    queryFn: async () => {
      const { data } = await axiosInstance.get<AppointmentSummary[]>(
        '/appointments/me',
        { params: queryParams },
      );
      return data;
    },
  });
}

export function useDoctorWidget() {
  return useQuery({
    queryKey: ['doctor-widget'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<DoctorWidgetStats>('/appointments/me/widget');
      return data;
    },
    refetchInterval: 60_000,
  });
}

// ---------------- Visit reports ---------------- //

export interface VisitMedicationEntry {
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string | null;
  notes?: string | null;
}

export interface VisitProfileUpdate {
  comorbidities?: Record<string, unknown> | null;
  diagnosis?: string | null;
  physician_notes?: string | null;
  demographics?: string | null;
}

export interface VisitReportCreatePayload {
  clinical_note: string;
  profile_updates?: VisitProfileUpdate | null;
  medications?: VisitMedicationEntry[] | null;
}

export interface VisitReport {
  id: number;
  appointment_id: number;
  doctor_id?: number | null;
  patient_id: number;
  clinical_note: string;
  structured_profile?: Record<string, unknown> | null;
  structured_medications?: Record<string, unknown>[] | null;
  created_at: string;
}

export type VisitChangeJobStatus =
  | 'pending'
  | 'processing'
  | 'applied'
  | 'failed'
  | 'skipped';
export type VisitChangeJobType = 'profile' | 'medication' | 'extract';
export type VisitChangeJobSource = 'structured' | 'extracted';

export interface VisitChangeJob {
  id: number;
  report_id: number;
  patient_id: number;
  change_type: VisitChangeJobType;
  source: VisitChangeJobSource;
  status: VisitChangeJobStatus;
  error?: string | null;
  attempts: number;
  processed_at?: string | null;
  created_at: string;
}

export interface VisitReportDetail extends VisitReport {
  change_jobs: VisitChangeJob[];
}

export function useCompleteAppointmentWithReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: VisitReportCreatePayload;
    }) => {
      const { data } = await axiosInstance.post<VisitReport>(
        `/appointments/${id}/complete-report`,
        payload,
        { headers: { 'Content-Type': 'application/json' } },
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['my-appointments'] });
      qc.invalidateQueries({ queryKey: ['doctor-widget'] });
    },
  });
}

export function useVisitReport(appointmentId?: number) {
  return useQuery({
    queryKey: ['visit-report', appointmentId],
    enabled: typeof appointmentId === 'number',
    queryFn: async () => {
      const { data } = await axiosInstance.get<VisitReportDetail>(
        `/appointments/${appointmentId}/report`,
      );
      return data;
    },
  });
}
