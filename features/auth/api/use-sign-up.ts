import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { SignUpFormValues, SignupResponse } from '../types/auth';

type DoctorPayload = {
  role: 'doctor';
  username: string;
  password: string;
  email?: string;
  phone_number?: string;
  first_name: string;
  last_name: string;
  specialization: string;
};

type B2CPayload = {
  username: string;
  password: string;
  email?: string;
  phone_number?: string;
  first_name: string;
  last_name: string;
  national_code: string;
  dob: string;
  gender: string;
  weight?: number;
  height?: number;
  caregiver?: {
    username: string;
    password: string;
    email?: string;
    phone_number?: string;
    first_name: string;
    last_name: string;
    relationship_to_patient: string;
  };
};

function signupErrorMessage(error: AxiosError): string {
  const data = error.response?.data as
    | { detail?: string | { message?: string; field?: string } | Array<{ msg?: string }> }
    | undefined;
  const detail = data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object' && !Array.isArray(detail) && detail.message) {
    return detail.message;
  }
  if (Array.isArray(detail)) {
    return (
      detail
        .map((item) => item?.msg)
        .filter(Boolean)
        .join(', ') || error.message || 'Signup failed'
    );
  }
  return error.message || 'Signup failed';
}

export const useSignup = () => {
  return useMutation<SignupResponse, AxiosError, SignUpFormValues>({
    mutationFn: async (data) => {
      if (data.role === 'doctor') {
        const payload: DoctorPayload = {
          role: 'doctor',
          username: data.username,
          password: data.password,
          email: data.email || undefined,
          phone_number: data.phone_number || undefined,
          first_name: data.first_name,
          last_name: data.last_name,
          specialization: data.specialization!.trim(),
        };
        const response = await axiosInstance.post<SignupResponse>('/register', payload, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.status !== 201 && response.status !== 200) {
          throw new Error('Signup failed');
        }
        return response.data;
      }

      const weight = data.weight?.trim() ? Number(data.weight) : undefined;
      const height = data.height?.trim() ? Number(data.height) : undefined;
      const payload: B2CPayload = {
        username: data.username,
        password: data.password,
        email: data.email || undefined,
        phone_number: data.phone_number || undefined,
        first_name: data.first_name,
        last_name: data.last_name,
        national_code: data.national_code.trim(),
        dob: data.dob,
        gender: data.gender,
        weight: weight && !Number.isNaN(weight) ? weight : undefined,
        height: height && !Number.isNaN(height) ? height : undefined,
      };

      if (data.patient_mode === 'with_caregiver' && data.caregiver) {
        payload.caregiver = {
          username: data.caregiver.username,
          password: data.caregiver.password,
          email: data.caregiver.email || undefined,
          phone_number: data.caregiver.phone_number || undefined,
          first_name: data.caregiver.first_name,
          last_name: data.caregiver.last_name,
          relationship_to_patient: data.caregiver.relationship_to_patient,
        };
      }

      const response = await axiosInstance.post<SignupResponse>('/register/b2c', payload, {
        headers: { 'Content-Type': 'application/json' },
      });
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
      let message = signupErrorMessage(error);
      if (
        error.response?.status === 409 ||
        /already exists|already taken/i.test(message)
      ) {
        message = message.includes('Username') || message.includes('must differ')
          ? message
          : 'Username is already taken.';
      }
      toast.error(message);
      console.error('Signup error:', error.response?.data || error);
    },
  });
};
