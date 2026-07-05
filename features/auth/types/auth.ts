export type LoginFormValues = {
  username: string;
  password: string;
};

export type SignUpFormValues = {
  username: string
  password: string,
  email: string,
  phone_number: string,
  first_name: string,
  last_name: string,
  role: "caregiver",
  relationship_to_user: string,
  assigned_patients?: number[]
}

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
  message: string;
  access?: string;
  refresh?: string;
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
] 