// hooks/useSummary.ts
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { SummaryData } from '@/features/dashboard/types/patient/summery';
import { AxiosError } from 'axios';

const fetchSummary = async (userId: number): Promise<SummaryData> => {
  const response = await axiosInstance.get<SummaryData>('/api/dashboard/summary', {
    params: { user_id: userId },
  });

  if (response.status !== 200) {
    throw new Error('Failed to fetch summary data');
  }

  return response.data;
};
export const useSummary = (userId: number) => {
  return useQuery<SummaryData, AxiosError>({
    queryKey: ['dashboard-summary', userId],
    queryFn: () => fetchSummary(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // داده‌ها تا ۵ دقیقه کش بشن
  });
};
