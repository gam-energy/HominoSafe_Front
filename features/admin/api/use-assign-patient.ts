import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';
import type { AdminAssignPatientRequest } from '../types/admin';
import { extractErrorMessage } from '../utils/adminErrors';

export function useAssignPatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AdminAssignPatientRequest) => {
      const { data } = await axiosInstance.post<{ detail: string }>(
        '/admin/assign-patient',
        {
          ...payload,
          // Backend expects the canonical UPPERCASE form per spec.
          role_assignment: payload.role_assignment.toUpperCase(),
        },
        { headers: { 'Content-Type': 'application/json' } },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Patient assigned to ${variables.role_assignment.toLowerCase()} successfully.`,
      );
      queryClient.invalidateQueries({ queryKey: ['admin-relations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({
        queryKey: ['admin-user', variables.patient_id],
      });
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to assign patient.'));
    },
  });
}
