import { useMutation, useQueryClient } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import axiosInstance from '@/api/axiosInstance';
import { LoginFormValues, LoginResponse } from '../types/auth';
import {
  AUTH_COOKIE_OPTS,
  clearAuthRedirectGuard,
} from '@/lib/auth-session';
import { fetchMyApplication } from '@/features/applications/api/use-applications';
import type { ApplicationSummary } from '@/features/applications/types/applications';

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

async function resolvePostLoginPath(): Promise<string> {
  try {
    const application: ApplicationSummary | null = await fetchMyApplication();
    if (application && application.status !== 'approved') {
      return '/application-status';
    }
  } catch (err) {
    const status = (err as AxiosError)?.response?.status;
    // Unexpected errors: fall through to dashboard rather than blocking login.
    if (status && status !== 404) {
      console.warn('Post-login application check failed:', status);
    }
  }
  return '/dashboard';
}

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

      const path = await resolvePostLoginPath();
      window.location.assign(path);
    },
    onError: (error) => {
      const axiosErr = error as AxiosError<{ detail?: string }>;
      const detail = axiosErr?.response?.data?.detail;
      const status = axiosErr?.response?.status;
      let message = detail || error.message || 'Login failed';
      if (status === 403) {
        message =
          detail ||
          'This account is inactive. Sign in with the caregiver username from your application to track status.';
      } else if (status === 401) {
        message = detail || 'Invalid username or password.';
      }
      toast.error(message);
      console.error('Login error:', error);
    },
  });
};
