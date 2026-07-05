import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { AxiosError } from 'axios';
import type { UpdateSessionResponse } from '../types/chat';

type UpdateSessionParams = {
  sessionId: string;
  title: string;
};

const updateSession = async ({
  sessionId,
  title,
}: UpdateSessionParams): Promise<UpdateSessionResponse> => {
  const response = await axiosInstance.patch<UpdateSessionResponse>(
    `/api/v1/chatbot/sessions/${sessionId}`,
    { title },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
};

export const useUpdateSession = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateSessionResponse, AxiosError, UpdateSessionParams>({
    mutationFn: updateSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};
