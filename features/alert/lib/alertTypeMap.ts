import {
  AlertType,
  BackendAlert,
  BackendAlertPayload,
  SensorData,
} from '../types/AlertSchema';

/** Map a backend severity string ("Critical"/"High"/...) to the UI enum. */
export function mapSeverity(raw?: string | null): AlertType['severity'] {
  switch ((raw || '').toLowerCase()) {
    case 'critical':
      return 'critical';
    case 'high':
      return 'high';
    case 'medium':
    case 'moderate':
      return 'medium';
    default:
      return 'low';
  }
}

/** Map a free-form backend alert_type to the UI alert category. */
export function mapAlertType(raw?: string | null): AlertType['alertType'] {
  const t = (raw || '').toLowerCase();
  if (t.includes('fall')) return 'FALL_DETECTED';
  if (t.includes('stroke')) return 'STROKE_RISK';
  if (t.includes('cardiac') || t.includes('af') || t.includes('arrhythmia'))
    return 'CARDIAC_RISK';
  if (t.includes('orthostatic')) return 'PREDICTED_ORTHOSTATIC_HYPOTENSION';
  if (t.includes('heart') || t.includes('hr') || t.includes('tachy'))
    return 'HR_SPIKE';
  if (t.includes('spo2') || t.includes('oxygen') || t.includes('hypox'))
    return 'OXYGEN_LOW';
  if (t.includes('temp') || t.includes('fever')) return 'TEMP_HIGH';
  if (t.includes('bp') || t.includes('pressure')) return 'BP_DROP';
  if (t.includes('co2') || t.includes('mq2') || t.includes('environment'))
    return 'ENVIRONMENT';
  if (t.includes('medication') || t.includes('medicine') || t.includes('dose'))
    return 'MEDICATION_REMINDER';
  return 'OTHER';
}

function mapVitals(vitals?: BackendAlert['vitals'] | BackendAlertPayload['vitals']): SensorData | undefined {
  if (!vitals) return undefined;
  const bpSys = vitals.bp_systolic ?? undefined;
  const bpDia = vitals.bp_diastolic ?? undefined;
  const activity =
    'activity' in vitals && vitals.activity != null ? String(vitals.activity) : undefined;
  return {
    heartRate: vitals.heart_rate ?? undefined,
    spo2: vitals.spo2 ?? undefined,
    temperature: vitals.temperature ?? undefined,
    activity,
    bp:
      bpSys != null || bpDia != null
        ? { systolic: bpSys, diastolic: bpDia }
        : undefined,
  };
}

/** Convert a REST ``AlertResponse`` row into the UI ``AlertType``. */
export function mapBackendAlert(a: BackendAlert): AlertType {
  const status = a.status || 'Active';
  const mapped: AlertType = {
    alertId: String(a.id),
    userId: String(a.user_id),
    alertType: mapAlertType(a.alert_type),
    severity: mapSeverity(a.severity),
    timestamp: a.timestamp || new Date().toISOString(),
    isAcknowledged: status !== 'Active',
    acknowledgedBy: a.acknowledged_by ? String(a.acknowledged_by) : undefined,
    acknowledgedAt: a.acknowledged_at || undefined,
    notes: a.notes || a.message || undefined,
    message: a.message || undefined,
    status,
    source: a.source || undefined,
  };
  const sensorData = mapVitals(a.vitals);
  if (sensorData) mapped.sensorData = sensorData;
  return mapped;
}

/** Convert a SYSTEM_ALERT WebSocket payload into the UI ``AlertType``. */
export function mapBackendPayload(p: BackendAlertPayload): AlertType {
  const status = p.status || 'Active';
  const mapped: AlertType = {
    alertId: String(p.alert_id),
    userId: String(p.patient_id),
    alertType: mapAlertType(p.alert_type),
    severity: mapSeverity(p.severity),
    timestamp: p.timestamp || new Date().toISOString(),
    isAcknowledged: status !== 'Active',
    notes: p.message || undefined,
    message: p.message || undefined,
    status,
    source: p.source || undefined,
    patientName: p.patient_name || undefined,
    vision: p.vision
      ? {
          visionDataId: p.vision.vision_data_id,
          source: p.vision.source,
          confidence: p.vision.confidence,
          frameUrl: p.vision.frame_url,
          hasInlineFrame: p.vision.has_inline_frame,
          metadata: p.vision.metadata,
        }
      : undefined,
  };
  const sensorData = mapVitals(p.vitals);
  if (sensorData) mapped.sensorData = sensorData;
  return mapped;
}
