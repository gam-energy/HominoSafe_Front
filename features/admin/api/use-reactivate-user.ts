import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';
import type { AdminUserDetail } from '../types/admin';
import { extractErrorMessage } from '../utils/adminErrors';

export function useReactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string) => {
      const { data } = await axiosInstance.post<AdminUserDetail>(
        `/admin/users/${id}/reactivate`,
      );
      return data;
    },
    onSuccess: (_, id) => {
      toast.success('User reactivated successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to reactivate user.'));
    },
  });
}
