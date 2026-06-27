export type CdsOverallStatus =
  | "stable"
  | "attention"
  | "critical"
  | "unknown"
  | string;

export type FindingSeverity = "low" | "moderate" | "high" | "critical" | string;

export interface CdsFinding {
  id?: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  category?: string;
  evidence?: string[];
}

export interface CdsRecommendation {
  id?: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | string;
  severity?: string;
  action?: string;
}

export interface SpecialistOutput {
  specialist: string;
  summary: string;
  evidence?: string[];
}

export interface CdsReport {
  patient_id: number;
  overall_status: CdsOverallStatus;
  analyzed_at?: string;
  critical_findings: CdsFinding[];
  recommendations: CdsRecommendation[];
  specialist_outputs?: SpecialistOutput[];
  reasoning_trace?: string;
}

export interface CdsAnalyzeRequest {
  force_refresh?: boolean;
  include_history_hours?: number;
}

export interface CdsFeedbackRequest {
  feedback: string;
}
