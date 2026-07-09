import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';
import { extractErrorMessage } from '../utils/adminErrors';

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string) => {
      await axiosInstance.delete(`/admin/users/${id}`);
      return id;
    },
    onSuccess: () => {
      toast.success('User deactivated successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-relations'] });
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to delete user.'));
    },
  });
}
