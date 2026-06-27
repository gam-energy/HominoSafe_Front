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

export interface ProfileDemographics {
  age?: number;
  weight?: number;
  height?: number;
  gender?: string;
}

export interface PatientProfileJson {
  diagnosis: string;
  comorbidities: string[];
  demographics?: ProfileDemographics;
  physician_notes: string;
  medical_history?: string;
  medications: ProfileMedication[];
  symptoms: ProfileSymptom[];
}

export type RefreshStatus = "pending" | "processing" | "ready" | "failed";

export interface KnowledgeStatusResponse {
  user_id: number;
  refresh_status: RefreshStatus;
  document_count?: number;
  chunk_count?: number;
  last_ingested_at?: string;
  summary?: string;
  error?: string;
}

export interface IngestKnowledgePayload {
  userId: number;
  profileJson: PatientProfileJson;
  files: File[];
  documentTypes: DocumentType[];
}
