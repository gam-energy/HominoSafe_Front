import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { AxiosError } from 'axios';
import type { ProfileData } from '@/features/medical-profile/types/medicalprofile';

const fetchProfile = async (): Promise<ProfileData | null> => {
  try {
    const response = await axiosInstance.get<ProfileData>('/api/profile/ehr');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const useProfile = () => {
  return useQuery<ProfileData | null, AxiosError>({
    queryKey: ['medical-profile'],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5,
  });
};
