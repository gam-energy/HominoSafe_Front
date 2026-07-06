import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { UserProfile } from '@/features/dashboard/types/caregiver/medical-profile';
import { AxiosError } from 'axios';

const fetchUserProfiles = async (userId: number): Promise<UserProfile[]> => {
  const response = await axiosInstance.get<UserProfile[]>('/api/profile/all', {
    params: { user_id: userId },
  });

  if (response.status !== 200) {
    throw new Error('Failed to fetch user profiles');
  }

  return response.data;
};

export const useUserProfiles = (userId: number) => {
  return useQuery<UserProfile[], AxiosError>({
    queryKey: ['patient-ehr-profiles', userId],
    queryFn: () => fetchUserProfiles(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });
};
