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

export interface ClinicalReportAdherenceBreakdown {
  total_doses?: number;
  taken?: number;
  late?: number;
  missed?: number;
  pending?: number;
  on_time_rate_percent?: number | null;
  missed_medication_names?: string[];
  per_medication?: Array<{
    name: string;
    dosage?: string | null;
    taken?: number;
    late?: number;
    missed?: number;
    pending?: number;
    scheduled_times?: string[];
  }>;
}

export interface ClinicalReportAdherenceSummary {
  timezone?: string;
  generated_at?: string;
  today?: ClinicalReportAdherenceBreakdown;
  interval?: ClinicalReportAdherenceBreakdown;
}

export interface ClinicalReportDetail extends ClinicalReportSummary {
  triggered_by?: string | null;
  actions?: ClinicalReportAction[] | string[] | null;
  watch_items?: string[] | null;
  graph_snapshot?: Record<string, unknown> | null;
  vitals_snapshot?: Record<string, unknown> | null;
  graph_hash?: string | null;
  adherence_summary?: ClinicalReportAdherenceSummary | null;
}

export interface ClinicalReportsListResponse {
  reports: ClinicalReportSummary[];
  count: number;
}
