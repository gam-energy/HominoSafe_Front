// hooks/useUpdateProfile.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { AxiosError } from 'axios';
import { ProfileData } from '@/features/medical-profile/types/medicalprofile';

// نوع داده ورودی برای به‌روزرسانی پروفایل
export interface UpdateProfileInput {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  dob: string; // ISO string
  gender: string;
  weight: number;
  height: number;
}

// تابع API برای به‌روزرسانی پروفایل
const updateProfile = async (data: UpdateProfileInput): Promise<ProfileData> => {
  const response = await axiosInstance.put<ProfileData>('/api/profile/', data, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status !== 200) {
    throw new Error('Failed to update profile');
  }
  return response.data;
};


// هوک useUpdateProfile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<ProfileData, AxiosError, UpdateProfileInput>({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
    },
  });
};
