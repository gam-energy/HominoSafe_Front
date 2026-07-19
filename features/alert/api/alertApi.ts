import axiosInstance from '@/api/axiosInstance';
import { BackendAlert } from '../types/AlertSchema';

export interface FallReportSummary {
  vision_data_id: number;
  patient_id: number;
  patient_name?: string | null;
  source: string;
  device_id?: string | null;
  confidence?: number | null;
  fall_detected: boolean;
  posture?: string | null;
  frame_url?: string | null;
  has_inline_frame?: boolean;
  metadata?: Record<string, unknown> | null;
  timestamp: string;
  alert_id?: number | null;
  severity?: string | null;
  status?: string | null;
}

export interface AlertActionItem {
  id: number;
  alert_id: number;
  action: string;
  actor_id?: number | null;
  notes?: string | null;
  timestamp: string;
}

export interface FallReportDetail extends FallReportSummary {
  frame_jpeg_b64?: string | null;
  metadata?: Record<string, unknown> | null;
  actions: AlertActionItem[];
}

export async function fetchAlertHistory(params?: {
  status?: string;
  severity?: string;
  limit?: number;
  offset?: number;
}): Promise<BackendAlert[]> {
  const { data } = await axiosInstance.get<BackendAlert[]>('/alert/history', {
    params,
    headers: { 'Content-Type': 'application/json' },
  });
  return data;
}

export async function fetchActiveAlerts(): Promise<BackendAlert[]> {
  const { data } = await axiosInstance.get<BackendAlert[]>('/alert/active', {
    headers: { 'Content-Type': 'application/json' },
  });
  return data;
}

export async function actOnAlert(
  alertId: string | number,
  action: 'acknowledge' | 'resolve' | 'dismiss' | 'note' | 'reopen',
  notes?: string
): Promise<BackendAlert> {
  const { data } = await axiosInstance.post<BackendAlert>(
    `/alert/${alertId}/action`,
    { action, notes },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return data;
}

export async function fetchFallReports(params?: {
  limit?: number;
  offset?: number;
  source?: string;
}): Promise<FallReportSummary[]> {
  const { data } = await axiosInstance.get<FallReportSummary[]>(
    '/alert/fall-reports',
    { params, headers: { 'Content-Type': 'application/json' } }
  );
  return data;
}

export async function fetchFallReport(
  visionDataId: number
): Promise<FallReportDetail> {
  const { data } = await axiosInstance.get<FallReportDetail>(
    `/alert/fall-reports/${visionDataId}`,
    { headers: { 'Content-Type': 'application/json' } }
  );
  return data;
}
