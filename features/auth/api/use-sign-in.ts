import { useMutation, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import axiosInstance from '@/api/axiosInstance';
import { LoginFormValues, LoginResponse } from '../types/auth';
import {
  AUTH_COOKIE_OPTS,
  clearAuthRedirectGuard,
} from '@/lib/auth-session';

const loginUser = async (credentials: LoginFormValues): Promise<LoginResponse> => {
  const formData = new URLSearchParams();
  formData.append('login_type', 'user');
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);

  const response = await axiosInstance.post<LoginResponse>('/token', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (response.status !== 200) throw new Error('Login failed');
  return response.data;
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, Error, LoginFormValues>({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      Cookies.set('access_token', data.access_token, {
        ...AUTH_COOKIE_OPTS,
        expires: 1,
      });
      Cookies.set('refresh_token', data.refresh_token, {
        ...AUTH_COOKIE_OPTS,
        expires: 7,
      });
      if (data.synapse_access_token) {
        Cookies.set('synapse_access_token', data.synapse_access_token, {
          ...AUTH_COOKIE_OPTS,
          expires: 7,
        });
      }
      clearAuthRedirectGuard();
      toast.success('Logged in successfully');
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      window.location.assign('/dashboard');
    },
    onError: (error) => {
      toast.error(error.message || 'خطا در ورود!');
      console.error('Login error:', error);
    },
  });
};
