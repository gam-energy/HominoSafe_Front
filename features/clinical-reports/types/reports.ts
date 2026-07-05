export interface ClinicalReportSummary {
  report_uuid: string;
  patient_id: number;
  created_at: string;
  overall_status?: string;
  summary?: string;
}

export interface ClinicalReportAction {
  title: string;
  description?: string;
  priority?: string;
}

export interface ClinicalReportDetail {
  report_uuid: string;
  patient_id: number;
  created_at: string;
  overview?: string;
  overall_status?: string;
  recommended_actions?: ClinicalReportAction[];
  watch_items?: string[];
  graph_snapshot?: Record<string, unknown>;
  vitals_snapshot?: Record<string, unknown>;
}

export interface ClinicalReportsListResponse {
  reports: ClinicalReportSummary[];
}
