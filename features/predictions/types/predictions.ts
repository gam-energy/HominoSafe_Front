export interface RiskProbability {
  condition: string;
  probability: number;
}

export interface PatientStateVector {
  timestamp?: string;
  state_vector?: number[];
  features?: Record<string, number | null>;
}

export interface RiskAssessmentResponse {
  user_id: number;
  risk_level?: string;
  risk_probabilities?: RiskProbability[];
  patient_state?: PatientStateVector;
  predicted_condition?: string;
  recommendation?: string;
  analyzed_at?: string;
}

export interface LatestPatientStateResponse {
  user_id: number;
  timestamp?: string;
  state_vector?: number[];
  features?: Record<string, number | null>;
  risk_level?: string;
}

export interface RiskAssessmentRequest {
  force_refresh?: boolean;
}
