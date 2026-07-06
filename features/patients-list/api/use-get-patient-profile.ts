import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { User } from '@/features/dashboard/types/caregiver/user';
import { AxiosError } from 'axios';

const fetchPatientUser = async (userId: number): Promise<User> => {
  const response = await axiosInstance.get<User>(`/user/${userId}`);

  if (response.status !== 200) {
    throw new Error('Failed to fetch patient');
  }

  return response.data;
};

export const useGetPatientProfile = (userId: number) => {
  return useQuery<User, AxiosError>({
    queryKey: ['patient-user', userId],
    queryFn: () => fetchPatientUser(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });
};
