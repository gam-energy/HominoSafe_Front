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

function parseDemographicsBlob(
  demographics?: string | null
): Partial<UserProfileData> {
  if (!demographics || !String(demographics).trim()) return {};
  const text = String(demographics).trim();
  if (!(text.startsWith('{') || text.startsWith('['))) return {};
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const toNum = (v: unknown): number | null => {
      if (v == null || v === '') return null;
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : null;
    };
    return {
      age: toNum(parsed.age),
      weight: toNum(parsed.weight),
      height: toNum(parsed.height),
      gender: parsed.gender != null ? String(parsed.gender) : null,
    };
  } catch {
    return {};
  }
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

function mergeProfileStats(
  primary: Partial<UserProfileData>,
  fallback: Partial<UserProfileData>
): ProfileStats {
  const merged: Partial<UserProfileData> = {
    ...fallback,
    ...Object.fromEntries(
      Object.entries(primary).filter(([, v]) => v != null && v !== '')
    ),
  };
  return mapProfileStats(merged);
}

export const getUserProfile = async (): Promise<UserProfileData> => {
  // refresh_token may be HttpOnly (not visible to js-cookie); access_token is enough
  const accessToken = Cookies.get('access_token');
  if (!accessToken) {
    throw new Error('No access token available');
  }

  const response = await axiosInstance.get<UserProfileData>('/api/profile/user');
  return response.data;
};

const fetchEhrDemographics = async (
  userId: number
): Promise<Partial<UserProfileData>> => {
  try {
    const response = await axiosInstance.get<
      Array<{ demographics?: string | null }>
    >('/api/profile/all', { params: { user_id: userId } });
    const rows = Array.isArray(response.data) ? response.data : [];
    for (const row of rows) {
      const parsed = parseDemographicsBlob(row.demographics);
      if (parsed.weight || parsed.height || parsed.age) {
        return parsed;
      }
    }
    return rows[0] ? parseDemographicsBlob(rows[0].demographics) : {};
  } catch {
    return {};
  }
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
  const fromUser = mapProfileStats(data ?? {});

  // Caregiver/doctor panels historically missed weight/height/age because
  // UserResponse omitted them and EHR demographics were never mirrored.
  if (fromUser.weight != null && fromUser.height != null && fromUser.age != null) {
    return fromUser;
  }

  const fromEhr = await fetchEhrDemographics(userId);
  return mergeProfileStats(data ?? {}, fromEhr);
};

export const useUserProfile = () => {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: getUserProfile,
    staleTime: 60_000,
    retry: 1,
  });
};

export const useProfileStats = (userId?: number) => {
  return useQuery({
    queryKey: ['profile-stats', userId ?? 'self'],
    queryFn: () => fetchProfileStats(userId),
    staleTime: 60_000,
  });
};
