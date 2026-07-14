import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';

export type DoseStatus = 'taken' | 'missed' | 'late' | 'pending';

export type DoseEventResponse = {
  id: number;
  medication_id: number;
  medication_name: string;
  medication_dosage: string;
  alert_id?: number | null;
  scheduled_at: string;
  scheduled_local: string;
  timezone?: string | null;
  status: DoseStatus;
  responded_at?: string | null;
  response_source?: string | null;
};

export const useRespondToDoseByAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      alertId,
      status,
    }: {
      alertId: string | number;
      status: 'taken' | 'missed';
    }) => {
      const { data } = await axiosInstance.post<DoseEventResponse>(
        `/api/medicine/doses/by-alert/${alertId}/respond`,
        { status },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medication-reminders'] });
      qc.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};
