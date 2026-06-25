import { useMutation, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import axiosInstance from '@/api/axiosInstance'; 
import { AxiosError } from 'axios';
import { LogoutResponse } from '../types/auth';


export const useSignOut = () => {
  const queryClient = useQueryClient();

  const clearSession = () => {
    queryClient.clear();
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    Cookies.remove('synapse_access_token');
    window.location.href = '/auth/sign-in';
  };

  return useMutation<LogoutResponse | null, AxiosError>({
    mutationFn: async (): Promise<LogoutResponse | null> => {
      const accessToken = Cookies.get('access_token');

      // Best-effort server-side logout; never block the client from signing out.
      if (accessToken) {
        try {
          const response = await axiosInstance.post<LogoutResponse>('/logout', {
            access_token: accessToken,
          });
          return response.data;
        } catch (error) {
          console.error('Server logout failed, clearing session anyway:', error);
          return null;
        }
      }

      return null;
    },

    onSuccess: () => {
      clearSession();
    },

    onError: (error) => {
      console.error('Logout failed:', error.response?.data || error.message);
      // Always clear local session even if something unexpected happened.
      clearSession();
    },
  });
};
