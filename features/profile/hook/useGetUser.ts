import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance';
import Cookies from 'js-cookie';
import type { ProfileStats, UserProfileData } from '../types/profile';

export function calcAgeFromDob(dob?: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export function mapProfileStats(data: Partial<UserProfileData>): ProfileStats {
  const age =
    data.age != null && data.age > 0
      ? data.age
      : calcAgeFromDob(data.dob);

  return {
    weight: data.weight != null && data.weight > 0 ? data.weight : null,
    height: data.height != null && data.height > 0 ? data.height : null,
    age,
  };
}

export const getUserProfile = async (): Promise<UserProfileData> => {
  const accessToken = Cookies.get('access_token');
  const refreshToken = Cookies.get('refresh_token');

  if (!accessToken || !refreshToken) {
    throw new Error('No tokens available');
  }

  const response = await axiosInstance.get<UserProfileData>('/api/profile/user/');
  return response.data;
};

const fetchProfileStats = async (userId?: number): Promise<ProfileStats> => {
  if (!userId) {
    const profile = await getUserProfile();
    return mapProfileStats(profile);
  }

  const response = await axiosInstance.get<UserProfileData | UserProfileData[]>(
    `/user/${userId}`
  );
  const data = Array.isArray(response.data) ? response.data[0] : response.data;
  return mapProfileStats(data ?? {});
};

export const useUserProfile = () => {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: getUserProfile,
    staleTime: 60_000,
  });
};

export const useProfileStats = (userId?: number) => {
  return useQuery({
    queryKey: ['profile-stats', userId ?? 'self'],
    queryFn: () => fetchProfileStats(userId),
    staleTime: 60_000,
  });
};
