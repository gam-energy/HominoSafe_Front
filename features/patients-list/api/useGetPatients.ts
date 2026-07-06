// hooks/usePatients.ts
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import { User } from '@/features/dashboard/types/caregiver/user';
import { AxiosError } from 'axios';

const fetchPatients = async (my_patients: boolean): Promise<User[]> => {
  const response = await axiosInstance.get<User[]>("/user/all/", {
    params: { my_patients },
  });

  if (response.status !== 200) {
    throw new Error('Failed to fetch patients');
  }

  return response.data;
};

export const usePatients = (my_patients: boolean) => {
  return useQuery<User[], AxiosError>({
    queryKey: ['patients', my_patients], // اضافه کردن my_patients به کلید کش
    queryFn: () => fetchPatients(my_patients),
    staleTime: 1000 * 60 * 10,
  });
};
