import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { SignUpFormValues, SignupResponse } from '../types/auth';

type SignupPayload =
  | {
      role: 'caregiver';
      username: string;
      password: string;
      email?: string;
      phone_number?: string;
      first_name: string;
      last_name: string;
      relationship_to_patient: string;
      referral_code?: string;
    }
  | {
      role: 'doctor';
      username: string;
      password: string;
      email?: string;
      phone_number?: string;
      first_name: string;
      last_name: string;
      specialization: string;
    };

export const useSignup = () => {
  return useMutation<SignupResponse, AxiosError, SignUpFormValues>({
    mutationFn: async (data) => {
      const payload: SignupPayload =
        data.role === 'doctor'
          ? {
              role: 'doctor',
              username: data.username,
              password: data.password,
              email: data.email || undefined,
              phone_number: data.phone_number || undefined,
              first_name: data.first_name,
              last_name: data.last_name,
              specialization: data.specialization!.trim(),
            }
          : {
              role: 'caregiver',
              username: data.username,
              password: data.password,
              email: data.email || undefined,
              phone_number: data.phone_number || undefined,
              first_name: data.first_name,
              last_name: data.last_name,
              relationship_to_patient: data.relationship_to_user,
              referral_code: data.referral_code.trim()
                ? data.referral_code.trim().toUpperCase()
                : undefined,
            };

      const response = await axiosInstance.post<SignupResponse>(
        '/register',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.status !== 201 && response.status !== 200) {
        throw new Error('Signup failed');
      }
      return response.data;
    },

    onSuccess: () => {
      toast.success('Account created — please sign in');
      window.location.href = '/auth/sign-in';
    },

    onError: (error) => {
      const data = error.response?.data as
        | { detail?: string | { message?: string; field?: string }; field?: string }
        | undefined;
      const detail = data?.detail;
      let message = error.message || 'Signup failed';
      if (typeof detail === 'string') {
        message = detail;
      } else if (detail && typeof detail === 'object' && detail.message) {
        message = detail.message;
      } else if (Array.isArray(detail)) {
        message =
          detail
            .map((item: { msg?: string }) => item?.msg)
            .filter(Boolean)
            .join(', ') || message;
      }

      if (
        error.response?.status === 409 ||
        /already exists|already taken/i.test(message)
      ) {
        message = message.includes('Username')
          ? message
          : 'Username is already taken.';
      }

      toast.error(message);
      console.error('Signup error:', error.response?.data || error);
    },
  });
};
