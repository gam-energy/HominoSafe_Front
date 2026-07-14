export interface ClinicalReportSummary {
  report_uuid: string;
  user_id: number;
  report_type: string;
  priority?: string | null;
  overview?: string | null;
  status: string;
  created_at: string;
  alert_id?: number | null;
}

export interface ClinicalReportAction {
  title?: string;
  description?: string;
  priority?: string;
  due?: string;
}

export interface ClinicalReportDetail extends ClinicalReportSummary {
  triggered_by?: string | null;
  actions?: ClinicalReportAction[] | string[] | null;
  watch_items?: string[] | null;
  graph_snapshot?: Record<string, unknown> | null;
  vitals_snapshot?: Record<string, unknown> | null;
  graph_hash?: string | null;
}

export interface ClinicalReportsListResponse {
  reports: ClinicalReportSummary[];
  count: number;
}
