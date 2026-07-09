import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';
import type { AdminUserDetail } from '../types/admin';
import { extractErrorMessage } from '../utils/adminErrors';

interface ResetPasswordArgs {
  id: number | string;
  password: string;
}

export function useResetUserPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, password }: ResetPasswordArgs) => {
      const { data } = await axiosInstance.patch<AdminUserDetail>(
        `/admin/users/${id}/password`,
        { password },
        { headers: { 'Content-Type': 'application/json' } },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success('Password reset successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin-user', variables.id] });
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to reset password.'));
    },
  });
}
