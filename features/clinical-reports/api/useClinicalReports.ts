import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { AxiosError } from 'axios';
import type { ClinicalReportsListResponse } from '../types/reports';

const fetchClinicalReports = async (
  patientId: number,
  limit = 20
): Promise<ClinicalReportsListResponse> => {
  const response = await axiosInstance.get<ClinicalReportsListResponse>(
    `/api/v1/clinical-reports/patient/${patientId}`,
    { params: { limit } }
  );
  return response.data;
};

export const useClinicalReports = (
  patientId: number,
  options?: { enabled?: boolean; limit?: number }
) => {
  return useQuery<ClinicalReportsListResponse, AxiosError>({
    queryKey: ['clinical-reports', patientId],
    queryFn: () => fetchClinicalReports(patientId, options?.limit ?? 20),
    enabled: !!patientId && (options?.enabled ?? true),
    staleTime: 60_000,
    retry: 1,
  });
};
