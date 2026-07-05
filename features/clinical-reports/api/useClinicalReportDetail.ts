import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { AxiosError } from 'axios';
import type { ClinicalReportDetail } from '../types/reports';

const fetchClinicalReportDetail = async (
  reportUuid: string
): Promise<ClinicalReportDetail> => {
  const response = await axiosInstance.get<ClinicalReportDetail>(
    `/api/v1/clinical-reports/${reportUuid}`
  );
  return response.data;
};

export const useClinicalReportDetail = (
  reportUuid: string | null,
  options?: { enabled?: boolean }
) => {
  return useQuery<ClinicalReportDetail, AxiosError>({
    queryKey: ['clinical-report', reportUuid],
    queryFn: () => fetchClinicalReportDetail(reportUuid!),
    enabled: !!reportUuid && (options?.enabled ?? true),
    staleTime: 60_000,
  });
};
