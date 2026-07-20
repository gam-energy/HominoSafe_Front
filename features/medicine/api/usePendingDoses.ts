import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';

export type PendingDose = {
  id: number;
  medication_id: number;
  medication_name: string;
  medication_dosage: string;
  alert_id?: number | null;
  scheduled_at: string;
  scheduled_local: string;
  timezone?: string | null;
  status: string;
};

type PendingList = {
  doses: PendingDose[];
  count: number;
};

export function usePendingDoses(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['medicine-doses-pending'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<PendingList>(
        '/api/medicine/doses/pending',
      );
      return data;
    },
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });
}
