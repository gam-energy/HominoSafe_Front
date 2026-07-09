import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';
import type { AdminRoomDeleteResponse } from '../types/admin';
import {
  extractErrorMessage,
  isSynapseTokenMissing,
} from '../utils/adminErrors';

interface DeleteRoomArgs {
  roomId: string;
  purge?: boolean;
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, purge = true }: DeleteRoomArgs) => {
      const { data } = await axiosInstance.delete<AdminRoomDeleteResponse>(
        `/admin/rooms/${encodeURIComponent(roomId)}`,
        { params: { purge } },
      );
      return data;
    },
    onSuccess: () => {
      toast.success('Room deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-rooms'] });
    },
    onError: (err) => {
      if (isSynapseTokenMissing(err)) {
        toast.error(
          'Synapse admin operations require SYNAPSE_ADMIN_TOKEN to be configured.',
        );
        return;
      }
      toast.error(extractErrorMessage(err, 'Failed to delete room.'));
    },
  });
}
