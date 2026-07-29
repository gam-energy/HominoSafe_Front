export type LoginFormValues = {
  username: string;
  password: string;
};

export type SignUpRole = "patient" | "doctor";
export type PatientSignupMode = "alone" | "with_caregiver";
/** How the patient medical profile is provided at B2C signup. */
export type PatientRecordsMode = "ehr" | "manual";

export type CaregiverSignupValues = {
  username: string;
  email: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  relationship_to_patient: string;
};

export type PasswordDelivery = 'choose' | 'email';

export type SignUpFormValues = {
  role: SignUpRole;
  /** Patient B2C mode; ignored when role is doctor. */
  patient_mode: PatientSignupMode;
  /** EHR seed vs manual demographics for Nest patient setup. */
  records_mode?: PatientRecordsMode;
  ehr_code?: string;
  /** Paid Nest order number required for patient setup. */
  order_number?: string;
  /** Patient chooses password, or we email a generated one. */
  password_delivery?: PasswordDelivery;
  username: string;
  password: string;
  confirmPassword?: string;
  email: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  /** Patient-only national / social-security code (not a business EHR code). */
  national_code: string;
  dob: string;
  gender: string;
  weight?: string;
  height?: string;
  /** Doctor-only */
  specialization?: string;
  /** Optional nested caregiver when patient_mode === with_caregiver */
  caregiver?: CaregiverSignupValues;
  referral_code?: string;
};

export type LoginFormProps = {
  onSubmit: (values: LoginFormValues) => void;
};

export type SignUpFormProps = {
  onSubmit: (values: SignUpFormValues) => void;
};

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  synapse_access_token?: string;
  expires_at?: string;
}

export interface RefreshTokenResponse {
  access_token?: string;
  refresh_token?: string;
  access?: string;
  refresh?: string;
}

export interface SignupResponse {
  message?: string;
  access?: string;
  refresh?: string;
  patient?: { id: number; username: string };
  caregiver?: { id: number; username: string } | null;
}

export interface LogoutResponse {
  detail: string;
}

export const relationships = [
  "Parent",
  "Spouse",
  "Sibling",
  "Child",
  "Friend",
  "Relative",
  "Caregiver",
  "Other",
];

export const specializations = [
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "General Surgery",
  "Radiology",
];

export const genders = ["Male", "Female"] as const;
