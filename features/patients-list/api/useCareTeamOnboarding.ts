import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';

export type ReferralCode = {
  id: number;
  code: string;
  target_role: string;
  max_uses: number;
  use_count: number;
  expires_at?: string | null;
  revoked: boolean;
  note?: string | null;
  is_usable: boolean;
  signup_url_hint?: string | null;
};

export type PatientOnboarding = {
  patient_id: number;
  records_complete: boolean;
  has_ehr: boolean;
  has_diagnosis: boolean;
  medication_count: number;
  knowledge_status?: string | null;
  monitoring_enabled: boolean;
  missing: string[];
};

export function useReferrals() {
  return useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<ReferralCode[]>('/referrals');
      return data;
    },
  });
}

export function useCreateCaregiverReferral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload?: {
      max_uses?: number;
      expires_in_days?: number;
      note?: string;
    }) => {
      const { data } = await axiosInstance.post<ReferralCode>(
        '/referrals/caregiver',
        {
          max_uses: payload?.max_uses ?? 1,
          expires_in_days: payload?.expires_in_days ?? 14,
          note: payload?.note,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['referrals'] });
      toast.success('Caregiver referral code created');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to create referral');
    },
  });
}

export type CreatePatientPayload = {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone_number?: string;
  national_code: string;
  dob: string;
  gender: 'Male' | 'Female';
  weight?: number;
  height?: number;
};

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePatientPayload) => {
      const { data } = await axiosInstance.post(
        '/user/patients',
        { role: 'patient', ...payload },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patient created — complete health records to unlock monitoring');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to create patient');
    },
  });
}

export function usePatientOnboarding(patientId: number | null) {
  return useQuery({
    queryKey: ['patient-onboarding', patientId],
    enabled: !!patientId,
    queryFn: async () => {
      const { data } = await axiosInstance.get<PatientOnboarding>(
        `/user/patients/${patientId}/onboarding`
      );
      return data;
    },
  });
}

export function useMarkRecordsComplete(patientId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (complete = true) => {
      const { data } = await axiosInstance.post<PatientOnboarding>(
        `/user/patients/${patientId}/records-complete`,
        { complete },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patient-onboarding', patientId] });
      qc.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Monitoring unlocked for this patient');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to update records status');
    },
  });
}
