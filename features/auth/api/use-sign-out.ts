import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { AxiosError } from 'axios';
import { LogoutResponse } from '../types/auth';
import { clearAuthCookies, redirectToSignIn } from '@/lib/auth-session';
import Cookies from 'js-cookie';

export const useSignOut = () => {
  const queryClient = useQueryClient();

  const clearSession = () => {
    queryClient.clear();
    clearAuthCookies();
    redirectToSignIn();
  };

  return useMutation<LogoutResponse | null, AxiosError>({
    mutationFn: async (): Promise<LogoutResponse | null> => {
      const accessToken = Cookies.get('access_token');

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
      clearSession();
    },
  });
};
