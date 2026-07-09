import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';
import type { AdminUnassignPatientRequest, AdminUnassignPatientResponse } from '../types/admin';
import { extractErrorMessage } from '../utils/adminErrors';

export function useUnassignPatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AdminUnassignPatientRequest) => {
      const { data } = await axiosInstance.post<AdminUnassignPatientResponse>(
        '/admin/unassign-patient',
        {
          ...payload,
          role_assignment: payload.role_assignment.toUpperCase(),
        },
        { headers: { 'Content-Type': 'application/json' } },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Patient unassigned from ${variables.role_assignment.toLowerCase()} successfully.`,
      );
      queryClient.invalidateQueries({ queryKey: ['admin-relations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({
        queryKey: ['admin-user', variables.patient_id],
      });
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to unassign patient.'));
    },
  });
}
