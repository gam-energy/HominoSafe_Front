export type DocumentType =
  | "clinical_note"
  | "lab_report"
  | "imaging"
  | "referral"
  | "discharge_summary"
  | "other";

export const DOCUMENT_TYPES: DocumentType[] = [
  "clinical_note",
  "lab_report",
  "imaging",
  "referral",
  "discharge_summary",
  "other",
];

export interface ProfileMedication {
  name: string;
  dosage: string;
  frequency: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export interface ProfileSymptom {
  name: string;
  severity: string;
  onset_date?: string;
  notes?: string;
}

export interface ProfileMedicalHistoryItem {
  name: string;
  level?: string;
  notes?: string;
  duration_months?: number;
  duration_years?: number;
}

export interface ProfileDemographics {
  age?: number;
  weight?: number;
  height?: number;
  gender?: string;
}

export interface PatientProfileJson {
  diagnosis: string;
  comorbidities: string[];
  demographics?: ProfileDemographics | string;
  physician_notes: string;
  medical_history?: string | ProfileMedicalHistoryItem[];
  medications: ProfileMedication[];
  symptoms: ProfileSymptom[];
}

export type RefreshStatus =
  | "idle"
  | "pending"
  | "processing"
  | "ready"
  | "failed";

export interface KnowledgeStatusResponse {
  user_id: number;
  refresh_status: RefreshStatus;
  document_count?: number;
  chunk_count?: number;
  last_ingested_at?: string | null;
  last_refreshed_at?: string | null;
  summary?: string | null;
  error?: string;
}

export interface PatientKnowledgePatient {
  user_id: number;
  first_name: string;
  last_name: string;
  age?: number;
}

export interface KnowledgeDocument {
  id?: number | string;
  original_filename?: string;
  filename?: string;
  document_type?: DocumentType | string;
  status?: "pending" | "processing" | "indexed" | "failed" | string;
  chunk_count?: number;
  content_summary?: string | null;
  uploaded_at?: string;
}

export interface PatientKnowledgeResponse {
  patient: PatientKnowledgePatient;
  profile: PatientProfileJson | null;
  knowledge: KnowledgeStatusResponse;
  documents: KnowledgeDocument[];
}

export interface IngestKnowledgeResponse {
  message?: string;
  user_id?: number;
  pending_files?: string[];
  profile_updated?: boolean;
}

export interface IngestKnowledgePayload {
  userId: number;
  profileJson: PatientProfileJson;
  files: File[];
  documentTypes: DocumentType[];
}
