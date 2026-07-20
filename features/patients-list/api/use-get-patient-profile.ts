import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { User } from '@/features/dashboard/types/caregiver/user';
import { AxiosError } from 'axios';

const fetchPatientUser = async (ref: string | number): Promise<User> => {
  const response = await axiosInstance.get<User>(`/user/${ref}`);

  if (response.status !== 200) {
    throw new Error('Failed to fetch patient');
  }

  return response.data;
};

/** Fetch patient by numeric id or public UUID. */
export const useGetPatientProfile = (ref?: string | number) => {
  return useQuery<User, AxiosError>({
    queryKey: ['patient-user', ref],
    queryFn: () => fetchPatientUser(ref as string | number),
    enabled: ref !== undefined && ref !== null && String(ref).length > 0,
    staleTime: 1000 * 60 * 10,
  });
};
