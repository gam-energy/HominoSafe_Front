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
  expires_in_seconds?: number;
  message?: string;
}

export interface PairedDevice {
  id: number;
  device_id: string;
  mqtt_username?: string | null;
  created_at: string;
  last_seen_at: string | null;
  online: boolean;
  activity?: string | null;
  body_position?: string | null;
  activity_intensity?: number;
}
