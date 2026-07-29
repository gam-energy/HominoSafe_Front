import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';
import type { AdminSetPrimaryCareTeamRequest } from '../types/admin';
import { extractErrorMessage } from '../utils/adminErrors';

export function useSetPrimaryCareTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AdminSetPrimaryCareTeamRequest) => {
      const { data } = await axiosInstance.post(
        '/admin/care-team/set-primary',
        {
          ...payload,
          role_assignment: payload.role_assignment.toLowerCase(),
        },
        { headers: { 'Content-Type': 'application/json' } },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success('Primary care-team member updated.');
      queryClient.invalidateQueries({ queryKey: ['admin-relations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({
        queryKey: ['admin-user', variables.patient_id],
      });
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to set primary member.'));
    },
  });
}
