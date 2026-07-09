import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { toast } from 'sonner';
import { extractErrorMessage } from '../utils/adminErrors';

export function useArchiveChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      await axiosInstance.delete(
        `/admin/chat-sessions/${encodeURIComponent(sessionId)}`,
      );
      return sessionId;
    },
    onSuccess: () => {
      toast.success('Chat session archived.');
      queryClient.invalidateQueries({ queryKey: ['admin-chat-sessions'] });
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err, 'Failed to archive chat session.'));
    },
  });
}
