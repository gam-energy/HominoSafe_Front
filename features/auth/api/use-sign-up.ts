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
  order_number: string;
  password_delivery: 'choose' | 'email';
  username: string;
  password?: string;
  email: string;
  phone_number?: string;
  ehr_code?: string;
  first_name?: string;
  last_name?: string;
  national_code?: string;
  dob?: string;
  gender?: string;
  weight?: number;
  height?: number;
  caregiver?: {
    username: string;
    email: string;
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

      if (!data.order_number?.trim()) {
        throw new Error('A paid Nest order number is required before patient setup.');
      }
      if (!data.email?.trim()) {
        throw new Error('Email is required.');
      }
      const delivery = data.password_delivery || 'choose';
      const useEhr = (data.records_mode || 'manual') === 'ehr';
      const payload: B2CPayload = {
        order_number: data.order_number.trim(),
        password_delivery: delivery,
        username: data.username,
        email: data.email.trim(),
        phone_number: data.phone_number || undefined,
      };
      if (delivery === 'choose') {
        payload.password = data.password;
      }

      if (useEhr) {
        const code = (data.ehr_code || '').trim().toUpperCase();
        if (!code) throw new Error('EHR code is required.');
        payload.ehr_code = code;
      } else {
        const weight = data.weight?.trim() ? Number(data.weight) : undefined;
        const height = data.height?.trim() ? Number(data.height) : undefined;
        payload.first_name = data.first_name;
        payload.last_name = data.last_name;
        payload.national_code = data.national_code.trim();
        payload.dob = data.dob;
        payload.gender = data.gender;
        payload.weight = weight && !Number.isNaN(weight) ? weight : undefined;
        payload.height = height && !Number.isNaN(height) ? height : undefined;
      }

      if (data.patient_mode === 'with_caregiver' && data.caregiver) {
        if (!data.caregiver.email?.trim()) {
          throw new Error('Caregiver email is required — we email their password.');
        }
        payload.caregiver = {
          username: data.caregiver.username,
          email: data.caregiver.email.trim(),
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

    onSuccess: (data, variables) => {
      const msg =
        (data as SignupResponse & { message?: string })?.message ||
        (variables.role === 'patient'
          ? 'Account created — check your email to verify, then sign in'
          : 'Account created — you can sign in now');
      toast.success(msg);
      if (variables.role === 'patient') {
        const id = encodeURIComponent(variables.username || variables.email || '');
        window.location.href = id
          ? `/auth/verify-email?identifier=${id}`
          : '/auth/verify-email';
        return;
      }
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
