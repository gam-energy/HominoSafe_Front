import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';

type UpdateAllergiesInput = {
  userId: number;
  allergies: string[];
};

export function useUpdateAllergies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, allergies }: UpdateAllergiesInput) => {
      const { data } = await axiosInstance.put(
        '/medical/logs',
        { user_id: userId, allergies },
        { headers: { 'Content-Type': 'application/json' } }
      );
      return data;
    },
    onSuccess: () => {
      toast.success('Allergies updated');
      queryClient.invalidateQueries({ queryKey: ['medical-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail;
      let message = 'Failed to update allergies';
      if (Array.isArray(detail)) {
        message = detail.map((d: any) => d.msg).join(' | ');
      } else if (typeof detail === 'string') {
        message = detail;
      }
      toast.error(message);
    },
  });
}
