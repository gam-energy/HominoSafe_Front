export interface UserProfileData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  id?: number;
  role?: string;
  status?: string;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  dob?: string | null;
  gender?: string | null;
  bmi?: number | null;
  bmi_category?: string | null;
}

export interface ProfileStats {
  weight: number | null;
  height: number | null;
  age: number | null;
}

export interface DevicePairResponse {
  otp?: string;
  pairing_code?: string;
  code?: string;
  expires_at?: string;
  expires_in?: number;
  message?: string;
}
