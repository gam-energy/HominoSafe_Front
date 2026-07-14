import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { AxiosError } from 'axios';

export type MedicationReminder = {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  notes?: string | null;
  reminder_times: string[];
  timezone?: string | null;
  next_dose_at?: string | null;
};

type ReminderListResponse = {
  medications: MedicationReminder[];
  count: number;
  timezone: string;
};

const fetchReminders = async (): Promise<ReminderListResponse> => {
  const { data } = await axiosInstance.get<ReminderListResponse>(
    '/api/medicine/reminders'
  );
  return data;
};

export const useMedicationReminders = (options?: { enabled?: boolean }) => {
  return useQuery<ReminderListResponse, AxiosError>({
    queryKey: ['medication-reminders'],
    queryFn: fetchReminders,
    staleTime: 1000 * 60,
    enabled: options?.enabled ?? true,
  });
};

export const useUpdateMedicationReminders = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      medicationId,
      reminder_times,
      timezone,
    }: {
      medicationId: number;
      reminder_times: string[];
      timezone?: string;
    }) => {
      const { data } = await axiosInstance.put<MedicationReminder>(
        `/api/medicine/${medicationId}/reminders`,
        { reminder_times, timezone }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medication-reminders'] });
      qc.invalidateQueries({ queryKey: ['medical-profile'] });
    },
  });
};
