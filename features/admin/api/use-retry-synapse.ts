import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';
import type { AdminUserDetail } from '../types/admin';
import { extractErrorMessage, isSynapseTokenMissing } from '../utils/adminErrors';

interface RetrySynapseArgs {
  id: number | string;
  password: string;
}

export function useRetrySynapse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, password }: RetrySynapseArgs) => {
      const { data } = await axiosInstance.post<AdminUserDetail>(
        `/admin/users/${id}/synapse/retry`,
        { password },
        { headers: { 'Content-Type': 'application/json' } },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success('Synapse account creation re-queued.');
      queryClient.invalidateQueries({ queryKey: ['admin-user', variables.id] });
    },
    onError: (err) => {
      if (isSynapseTokenMissing(err)) {
        toast.error(
          'Synapse admin operations require SYNAPSE_ADMIN_TOKEN to be configured.',
        );
        return;
      }
      toast.error(
        extractErrorMessage(err, 'Failed to queue Synapse account creation.'),
      );
    },
  });
}
