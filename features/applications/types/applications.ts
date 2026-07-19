export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'payment_pending'
  | 'payment_submitted'
  | 'approved'
  | 'rejected';

export type Gender = 'Male' | 'Female' | 'Other';

export type PublicClinic = {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
};

export type CaregiverApplicationInput = {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone_number?: string;
  relationship_to_patient: string;
};

export type PatientApplicationInput = {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone_number?: string;
  national_code: string;
  dob: string;
  gender: Gender;
  weight?: number;
  height?: number;
};

export type CreateApplicationPayload = {
  clinic_id: number;
  caregiver: CaregiverApplicationInput;
  patient: PatientApplicationInput;
};

export type PersonSummary = {
  id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string | null;
  phone_number?: string | null;
  relationship_to_patient?: string | null;
  national_code?: string | null;
  dob?: string | null;
  gender?: Gender | string | null;
  weight?: number | null;
  height?: number | null;
};

export type PaymentReceiptMeta = {
  filename?: string | null;
  content_type?: string | null;
  size?: number | null;
  uploaded_at?: string | null;
};

export type ApplicationSummary = {
  id: number;
  public_id?: string;
  status: ApplicationStatus;
  clinic?: PublicClinic | null;
  clinic_id?: number | null;
  caregiver?: PersonSummary | null;
  patient?: PersonSummary | null;
  payment_amount?: number | null;
  currency?: string | null;
  payment_instructions?: string | null;
  receipt?: PaymentReceiptMeta | null;
  has_receipt?: boolean;
  receipt_name?: string | null;
  receipt_submitted_at?: string | null;
  review_note?: string | null;
  rejection_reason?: string | null;
  rejection_note?: string | null;
  note?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  payment_requested_at?: string | null;
  payment_submitted_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
};

export type ReviewAction =
  | 'under_review'
  | 'request_payment'
  | 'approve'
  | 'reject';

export type PatchApplicationPayload = {
  action: ReviewAction;
  payment_amount?: number;
  currency?: string;
  payment_instructions?: string;
  note?: string;
  /** Required by backend when action is reject. */
  reason?: string;
};

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'submitted',
  'under_review',
  'payment_pending',
  'payment_submitted',
  'approved',
  'rejected',
];

export const APPLICATION_TIMELINE: ApplicationStatus[] = [
  'submitted',
  'under_review',
  'payment_pending',
  'payment_submitted',
  'approved',
];

export const GENDERS: Gender[] = ['Male', 'Female', 'Other'];

export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
export const RECEIPT_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';
