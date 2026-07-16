import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { AxiosError } from 'axios';

export type SessionResponse = {
  session_id: string;
  status?: string;
  message?: string;
};

export type CreateSessionInput = {
  patient_id?: number;
};

const createSession = async (
  input?: CreateSessionInput
): Promise<SessionResponse> => {
  const body =
    input?.patient_id != null ? { patient_id: input.patient_id } : {};
  const response = await axiosInstance.post<SessionResponse>(
    '/api/v1/chatbot/sessions',
    body,
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (response.status !== 201 && response.status !== 200) {
    throw new Error('Failed to create session');
  }

  return response.data;
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation<SessionResponse, AxiosError, CreateSessionInput | void>({
    mutationFn: (input) => createSession(input || undefined),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },

    onError: (error) => {
      console.error('Create session error:', error);
    },
  });
};
