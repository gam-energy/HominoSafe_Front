import axiosInstance from '@/api/axiosInstance';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type ClinicStatus = 'ACTIVE' | 'INACTIVE';

export interface Clinic {
  id: number;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  contact_person?: string | null;
  status: ClinicStatus;
  notes?: string | null;
}

export interface ClinicSummary extends Clinic {
  doctor_count: number;
  patient_count: number;
  caregiver_count?: number;
  member_count?: number;
  billing_total: number;
  billing_paid: number;
  billing_outstanding: number;
  unpaid_count?: number;
  overdue_count?: number;
  paid_count?: number;
  collection_rate?: number;
  patients_per_doctor?: number;
  latest_billing_year?: number | null;
  latest_billing_status?: string | null;
}

export interface ClinicMember {
  id: number;
  uuid?: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  email?: string | null;
  phone_number?: string | null;
  status?: string | null;
}

export interface ClinicBilling {
  id: number;
  clinic_id: number;
  year: number;
  amount: number;
  currency: string;
  status: 'unpaid' | 'paid' | 'overdue' | 'waived';
  due_date?: string | null;
  paid_at?: string | null;
  invoice_number?: string | null;
  notes?: string | null;
}

export interface ClinicBillingRow extends ClinicBilling {
  clinic_name?: string;
}

export interface ClinicPayload {
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  contact_person?: string | null;
  status?: ClinicStatus;
  notes?: string | null;
}

export interface BillingPayload {
  year: number;
  amount: number;
  currency?: string;
  status?: ClinicBilling['status'];
  due_date?: string | null;
  invoice_number?: string | null;
  notes?: string | null;
}

export interface BillingUpdatePayload {
  amount?: number;
  currency?: string;
  status?: ClinicBilling['status'];
  due_date?: string | null;
  paid_at?: string | null;
  invoice_number?: string | null;
  notes?: string | null;
}

const fetchClinics = async () => {
  const { data } = await axiosInstance.get<ClinicSummary[]>('/admin/clinics');
  return data;
};

export function useClinics() {
  return useQuery({
    queryKey: ['admin-clinics'],
    queryFn: fetchClinics,
  });
}

const fetchClinic = async (id: number) => {
  const { data } = await axiosInstance.get<ClinicSummary>(`/admin/clinics/${id}`);
  return data;
};

export function useClinic(id?: number) {
  return useQuery({
    queryKey: ['admin-clinic', id],
    enabled: typeof id === 'number',
    queryFn: () => fetchClinic(id as number),
  });
}

export function useCreateClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ClinicPayload) => {
      const { data } = await axiosInstance.post<Clinic>('/admin/clinics', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-clinics'] }),
  });
}

export function useUpdateClinic(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ClinicPayload>) => {
      const { data } = await axiosInstance.put<Clinic>(`/admin/clinics/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-clinics'] });
      qc.invalidateQueries({ queryKey: ['admin-clinic', id] });
    },
  });
}

// Logo
export function useClinicLogo(clinicId?: number) {
  return useQuery({
    queryKey: ['admin-clinic-logo', clinicId],
    enabled: typeof clinicId === 'number',
    retry: false,
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/admin/clinics/${clinicId}/logo`, {
        responseType: 'blob',
      });
      return URL.createObjectURL(data as Blob);
    },
  });
}

export function useUploadClinicLogo(clinicId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await axiosInstance.put(`/admin/clinics/${clinicId}/logo`, form);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-clinic-logo', clinicId] }),
  });
}

export function useDeleteClinic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await axiosInstance.delete(`/admin/clinics/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-clinics'] }),
  });
}

// Members
export function useClinicMembers(clinicId?: number, role?: 'DOCTOR' | 'PATIENT' | 'CAREGIVER') {
  return useQuery({
    queryKey: ['admin-clinic-members', clinicId, role],
    enabled: typeof clinicId === 'number',
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (role) params.role = role.toLowerCase();
      const { data } = await axiosInstance.get<ClinicMember[]>(
        `/admin/clinics/${clinicId}/members`,
        { params },
      );
      return data;
    },
  });
}

export function useAssignClinicMember(clinicId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      const { data } = await axiosInstance.post(`/admin/clinics/${clinicId}/members`, {
        user_id: userId,
        clinic_id: clinicId,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-clinic-members', clinicId] });
      qc.invalidateQueries({ queryKey: ['admin-clinics'] });
    },
  });
}

export function useRemoveClinicMember(clinicId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      await axiosInstance.delete(`/admin/clinics/${clinicId}/members/${userId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-clinic-members', clinicId] });
      qc.invalidateQueries({ queryKey: ['admin-clinics'] });
    },
  });
}

// Billings
export function useClinicBillings(clinicId?: number) {
  return useQuery({
    queryKey: ['admin-clinic-billings', clinicId],
    enabled: typeof clinicId === 'number',
    queryFn: async () => {
      const { data } = await axiosInstance.get<ClinicBilling[]>(
        `/admin/clinics/${clinicId}/billings`,
      );
      return data;
    },
  });
}

export function useAllBillings() {
  return useQuery({
    queryKey: ['admin-all-billings'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<ClinicBillingRow[]>('/admin/clinics/billings/all');
      return data;
    },
  });
}

export function useCreateBilling(clinicId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BillingPayload) => {
      const { data } = await axiosInstance.post<ClinicBilling>(
        `/admin/clinics/${clinicId}/billings`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-clinic-billings', clinicId] });
      qc.invalidateQueries({ queryKey: ['admin-all-billings'] });
      qc.invalidateQueries({ queryKey: ['admin-clinics'] });
    },
  });
}

export function useUpdateBilling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ billingId, payload }: { billingId: number; payload: BillingUpdatePayload }) => {
      const { data } = await axiosInstance.put<ClinicBilling>(
        `/admin/clinics/billings/${billingId}`,
        payload,
      );
      return data;
    },
    onSuccess: (b) => {
      qc.invalidateQueries({ queryKey: ['admin-clinic-billings', b.clinic_id] });
      qc.invalidateQueries({ queryKey: ['admin-all-billings'] });
      qc.invalidateQueries({ queryKey: ['admin-clinics'] });
    },
  });
}

export function useDeleteBilling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (billingId: number) => {
      await axiosInstance.delete(`/admin/clinics/billings/${billingId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-all-billings'] });
      qc.invalidateQueries({ queryKey: ['admin-clinics'] });
    },
  });
}
