import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import axiosInstance from '@/api/axiosInstance';
import type {
  ApplicationStatus,
  ApplicationSummary,
  CreateApplicationPayload,
  PatchApplicationPayload,
  PublicClinic,
} from '../types/applications';

export const applicationKeys = {
  all: ['applications'] as const,
  me: ['applications', 'me'] as const,
  clinics: ['applications', 'clinics'] as const,
  review: (status?: string) => ['applications', 'review', status ?? 'all'] as const,
  receipt: (id: number) => ['applications', 'receipt', id] as const,
};

export async function fetchPublicClinics(): Promise<PublicClinic[]> {
  const { data } = await axiosInstance.get<PublicClinic[]>('/applications/clinics');
  return data;
}

export function usePublicClinics() {
  return useQuery({
    queryKey: applicationKeys.clinics,
    queryFn: fetchPublicClinics,
  });
}

export async function createApplication(
  payload: CreateApplicationPayload
): Promise<ApplicationSummary> {
  const { data } = await axiosInstance.post<ApplicationSummary>(
    '/applications',
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );
  return data;
}

export function useCreateApplication() {
  return useMutation({
    mutationFn: createApplication,
    onError: (error: AxiosError<{ detail?: string }>) => {
      const detail = error.response?.data?.detail;
      toast.error(
        typeof detail === 'string' ? detail : error.message || 'Failed to submit application'
      );
    },
  });
}

export async function fetchMyApplication(): Promise<ApplicationSummary | null> {
  try {
    const { data } = await axiosInstance.get<ApplicationSummary>('/applications/me');
    return data;
  } catch (err) {
    const error = err as AxiosError;
    if (error.response?.status === 404) return null;
    throw err;
  }
}

export function useMyApplication(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: applicationKeys.me,
    queryFn: fetchMyApplication,
    enabled: options?.enabled ?? true,
    retry: (failureCount, error) => {
      const status = (error as AxiosError)?.response?.status;
      if (status === 404) return false;
      return failureCount < 2;
    },
  });
}

export async function uploadPaymentReceipt(file: File): Promise<ApplicationSummary> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await axiosInstance.post<ApplicationSummary>(
    '/applications/me/payment-receipt',
    formData
  );
  return data;
}

export function useUploadPaymentReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadPaymentReceipt,
    onSuccess: (data) => {
      queryClient.setQueryData(applicationKeys.me, data);
      queryClient.invalidateQueries({ queryKey: applicationKeys.me });
      toast.success('Payment receipt uploaded');
    },
    onError: (error: AxiosError<{ detail?: string }>) => {
      const detail = error.response?.data?.detail;
      toast.error(
        typeof detail === 'string' ? detail : error.message || 'Failed to upload receipt'
      );
    },
  });
}

export async function fetchApplicationsForReview(
  status?: ApplicationStatus | string
): Promise<ApplicationSummary[]> {
  const { data } = await axiosInstance.get<ApplicationSummary[]>('/applications/review', {
    params: status ? { status } : undefined,
  });
  return data;
}

export function useApplicationsReview(status?: ApplicationStatus | string) {
  return useQuery({
    queryKey: applicationKeys.review(status),
    queryFn: () => fetchApplicationsForReview(status),
  });
}

export async function patchApplication(
  id: number,
  payload: PatchApplicationPayload
): Promise<ApplicationSummary> {
  const { data } = await axiosInstance.patch<ApplicationSummary>(
    `/applications/${id}`,
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );
  return data;
}

export function usePatchApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PatchApplicationPayload }) =>
      patchApplication(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      toast.success('Application updated');
    },
    onError: (error: AxiosError<{ detail?: string }>) => {
      const detail = error.response?.data?.detail;
      toast.error(
        typeof detail === 'string' ? detail : error.message || 'Failed to update application'
      );
    },
  });
}

export async function fetchPaymentReceiptBlob(id: number): Promise<Blob> {
  const { data } = await axiosInstance.get<Blob>(`/applications/${id}/payment-receipt`, {
    responseType: 'blob',
  });
  return data;
}

export function usePaymentReceipt(id: number | null, enabled = true) {
  return useQuery({
    queryKey: applicationKeys.receipt(id ?? 0),
    queryFn: () => fetchPaymentReceiptBlob(id!),
    enabled: enabled && id != null,
    staleTime: 60_000,
  });
}
