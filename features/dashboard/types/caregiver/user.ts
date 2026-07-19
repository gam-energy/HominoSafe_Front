// types/user.ts
export interface User {
  id: number;
  uuid?: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: 'patient' | 'caregiver' | string;
  status: string;
  caregiver_id?: number | null;
  doctor_id?: number | null;
  records_complete?: boolean;
}
