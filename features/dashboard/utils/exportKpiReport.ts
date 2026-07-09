import type { SummaryData } from '@/features/dashboard/types/patient/summery';
import type { RecommendData } from '@/features/dashboard/components/patient/RecommendSection';
import { printHtmlReport } from '@/lib/export/printHtmlReport';

export type KpiReportMeta = {
  patientId: number;
  patientName?: string;
  generatedAt?: string;
  activity?: string;
};

export type KpiReportPayload = {
  summary: SummaryData;
  recommendations?: RecommendData | null;
  meta: KpiReportMeta;
};

const KPI_LABELS: Record<string, string> = {
  heart_rate: 'Heart Rate',
  bp_systolic: 'BP Systolic',
  bp_diastolic: 'BP Diastolic',
  spo2: 'SpO₂',
  temperature: 'Temperature',
  body_temperature: 'Body Temperature',
  humidity: 'Humidity',
  mq2: 'Air Quality (MQ)',
  CO2: 'CO₂',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(value: number | null | undefined, suffix = ''): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${Math.round(value * 10) / 10}${suffix}`;
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function kpiRows(summary: SummaryData): string {
  const kpis = summary.kpis ?? {};
  const rows: string[] = [];

  const addRow = (label: string, kpiKey: string) => {
    const k = kpis[kpiKey];
    if (!k?.value && k?.value !== 0) return;
    rows.push(`
      <tr>
        <td>${escapeHtml(label)}</td>
        <td>${fmt(k.value)} ${escapeHtml(k.unit ?? '')}</td>
        <td>${fmt(k.average_last_24h)}</td>
        <td>${fmt(k.average_last_7d)}</td>
        <td>${escapeHtml(String(k.trend ?? 'stable'))}</td>
      </tr>
    `);
  };

  addRow('Heart Rate', 'heart_rate');
  if (kpis.bp_systolic?.value != null || kpis.bp_diastolic?.value != null) {
    rows.push(`
      <tr>
        <td>Blood Pressure</td>
        <td>${fmt(kpis.bp_systolic?.value)} / ${fmt(kpis.bp_diastolic?.value)} mmHg</td>
        <td>${fmt(kpis.bp_systolic?.average_last_24h)} / ${fmt(kpis.bp_diastolic?.average_last_24h)}</td>
        <td>${fmt(kpis.bp_systolic?.average_last_7d)} / ${fmt(kpis.bp_diastolic?.average_last_7d)}</td>
        <td>${escapeHtml(String(kpis.bp_systolic?.trend ?? 'stable'))}</td>
      </tr>
    `);
  }
  Object.entries(KPI_LABELS).forEach(([key, label]) => {
    if (key === 'heart_rate' || key.startsWith('bp_')) return;
    addRow(label, key);
  });

  if (rows.length === 0) {
    return '<p class="empty">No live vitals recorded.</p>';
  }

  return `
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Current</th>
          <th>24h Avg</th>
          <th>7d Avg</th>
          <th>Trend</th>
        </tr>
      </thead>
      <tbody>${rows.join('')}</tbody>
    </table>
  `;
}

function dailySection(summary: SummaryData): string {
  const d = summary.daily_overview;
  return `
    <div class="grid">
      <div class="stat"><span>Avg Heart Rate</span><strong>${fmt(d?.avg_heart_rate)} bpm</strong></div>
      <div class="stat"><span>Avg SpO₂</span><strong>${fmt(d?.avg_spo2)} %</strong></div>
      <div class="stat"><span>Max BP Systolic</span><strong>${fmt(d?.max_bp_systolic)} mmHg</strong></div>
      <div class="stat"><span>Min BP Diastolic</span><strong>${fmt(d?.min_bp_diastolic)} mmHg</strong></div>
    </div>
    <p class="muted">Date: ${escapeHtml(d?.date ?? '—')}</p>
  `;
}

function alertsSection(summary: SummaryData): string {
  const alerts = summary.recent_alerts ?? [];
  if (!alerts.length) {
    return '<p class="empty">No recent alerts.</p>';
  }
  return `<ul>${alerts
    .map(
      (a) => `
    <li>
      <div class="alert-head">
        <strong>${escapeHtml(a.alert_type?.replace(/_/g, ' ') ?? 'Alert')}</strong>
        ${a.severity ? `<span class="badge">${escapeHtml(a.severity)}</span>` : ''}
        ${a.time ? `<span class="muted">${escapeHtml(fmtDate(a.time))}</span>` : ''}
      </div>
      <p>${escapeHtml(a.message)}</p>
    </li>`
    )
    .join('')}</ul>`;
}

function riskSection(summary: SummaryData): string {
  const risks = summary.risk_assessments ?? [];
  if (!risks.length) {
    return '<p class="empty">No risk assessments.</p>';
  }
  return risks
    .map(
      (r) => `
    <div class="card risk">
      <div class="card-head">
        <span class="badge">${escapeHtml(r.risk_level.toUpperCase())}</span>
        <span class="muted">${escapeHtml(fmtDate(r.time))}</span>
      </div>
      <p><strong>Predicted:</strong> ${escapeHtml(r.predicted_condition)}</p>
      <p><strong>Recommendation:</strong> ${escapeHtml(r.recommendation)}</p>
    </div>`
    )
    .join('');
}

function recommendationsSection(rec?: RecommendData | null): string {
  if (!rec) return '<p class="empty">No recommendations available.</p>';

  const general = rec.general_recommendations ?? [];
  const metrics = Object.entries(rec.health_metrics ?? {});

  return `
    <p class="muted">Alert level: ${escapeHtml(rec.alert_level_value)} · ${escapeHtml(fmtDate(rec.timestamp))}</p>
    ${
      metrics.length
        ? `<table>
        <thead><tr><th>Metric</th><th>Value</th><th>Status</th><th>Recommendation</th></tr></thead>
        <tbody>${metrics
          .map(
            ([name, m]) => `
          <tr>
            <td>${escapeHtml(name.replace(/_/g, ' '))}</td>
            <td>${fmt(m.value)} (${escapeHtml(m.reference_range)})</td>
            <td>${escapeHtml(m.status)}</td>
            <td>${escapeHtml(m.recommendation)}</td>
          </tr>`
          )
          .join('')}</tbody></table>`
        : ''
    }
    ${
      general.length
        ? `<ul>${general.map((g) => `<li>${escapeHtml(g)}</li>`).join('')}</ul>`
        : '<p class="empty">No general recommendations.</p>'
    }
  `;
}

export function buildKpiReportHtml({ summary, recommendations, meta }: KpiReportPayload): string {
  const generatedAt = meta.generatedAt ?? new Date().toISOString();
  const title = meta.patientName
    ? `Health KPI Report — ${meta.patientName}`
    : `Health KPI Report — Patient #${meta.patientId}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; color: #111; margin: 0; padding: 32px; line-height: 1.5; }
    h1 { font-size: 1.5rem; margin: 0 0 8px; }
    h2 { font-size: 1rem; margin: 28px 0 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
    .meta { color: #6b7280; font-size: 0.875rem; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; margin-top: 8px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; }
    th { background: #f9fafb; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .stat { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
    .stat span { display: block; font-size: 0.75rem; color: #6b7280; text-transform: uppercase; }
    .stat strong { font-size: 1.25rem; }
    ul { padding-left: 1.25rem; }
    li { margin-bottom: 12px; }
    .alert-head { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 4px; }
    .badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 10px; }
    .card-head { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .muted { color: #6b7280; font-size: 0.8rem; }
    .empty { color: #9ca3af; font-style: italic; }
    @media print {
      body { padding: 16px; }
      h2 { page-break-after: avoid; }
      table, .card { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">
    Generated: ${escapeHtml(fmtDate(generatedAt))}<br />
    Last data update: ${escapeHtml(fmtDate(summary.last_updated))}
    ${meta.activity ? `<br />Activity: ${escapeHtml(meta.activity)}` : ''}
  </div>

  <h2>Live Vitals</h2>
  ${kpiRows(summary)}

  <h2>Today's Summary</h2>
  ${dailySection(summary)}

  <h2>Recent Alerts</h2>
  ${alertsSection(summary)}

  <h2>Risk Assessments</h2>
  ${riskSection(summary)}

  <h2>Recommendations</h2>
  ${recommendationsSection(recommendations)}

  <p class="muted" style="margin-top:32px">SenioSentry / SenioSentry — confidential health summary</p>
</body>
</html>`;
}

export function downloadKpiReportHtml(payload: KpiReportPayload, filename?: string): void {
  const html = buildKpiReportHtml(payload);
  const date = new Date().toISOString().slice(0, 10);
  const name =
    filename ??
    `kpi-report-patient-${payload.meta.patientId}-${date}.html`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function printKpiReportAsPdf(payload: KpiReportPayload): void {
  printHtmlReport(buildKpiReportHtml(payload));
}
