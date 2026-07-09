import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';
import type { AdminUserCreate, AdminUserDetail } from '../types/admin';
import { extractErrorMessage } from '../utils/adminErrors';

export function useCreateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AdminUserCreate) => {
      const { data } = await axiosInstance.post<AdminUserDetail>(
        '/admin/users',
        payload,
        { headers: { 'Content-Type': 'application/json' } },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(`${variables.role} user created successfully.`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-relations'] });
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to create user.'));
    },
  });
}
