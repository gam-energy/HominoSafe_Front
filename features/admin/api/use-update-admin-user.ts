import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';
import type { AdminUserUpdate, AdminUserDetail } from '../types/admin';
import { extractErrorMessage } from '../utils/adminErrors';

interface UpdateArgs {
  id: number | string;
  payload: AdminUserUpdate;
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: UpdateArgs) => {
      const { data } = await axiosInstance.put<AdminUserDetail>(
        `/admin/users/${id}`,
        payload,
        { headers: { 'Content-Type': 'application/json' } },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success('User updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-relations'] });
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to update user.'));
    },
  });
}
