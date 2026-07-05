import { printHtmlReport } from '@/lib/export/printHtmlReport';

export type HealthKpisHeroCard = {
  label: string;
  value: string;
  suffix: string;
  delta: number;
  deltaUp: boolean;
};

export type HealthKpisSystemScore = {
  label: string;
  value: number;
};

export type HealthKpisRiskItem = {
  label: string;
  level: string;
  score: number;
};

export type HealthKpisVitalSeries = {
  label: string;
  unit: string;
  trend: number;
  latest: number;
  avg: number;
  min: number;
  max: number;
  readings: Array<{ time: string; display: string }>;
};

export type HealthKpisChartCapture = {
  title: string;
  svgHtml: string;
};

export type HealthKpisReportData = {
  patientName?: string;
  userId?: number;
  generatedAt: string;
  heroCards: HealthKpisHeroCard[];
  systemScores: HealthKpisSystemScore[];
  riskBreakdown: HealthKpisRiskItem[];
  vitals: HealthKpisVitalSeries[];
  charts?: HealthKpisChartCapture[];
};

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildHealthKpisReportHtml(data: HealthKpisReportData): string {
  const patientLabel =
    data.patientName?.trim() ||
    (data.userId ? `Patient #${data.userId}` : 'Patient');

  const heroRows = data.heroCards
    .map(
      (c) => `
    <tr>
      <td>${escapeHtml(c.label)}</td>
      <td><strong>${escapeHtml(c.value)}${escapeHtml(c.suffix)}</strong></td>
      <td>${c.deltaUp ? '▲' : '▼'} ${escapeHtml(c.delta)}</td>
    </tr>`
    )
    .join('');

  const systemRows = data.systemScores
    .map(
      (s) => `
    <tr>
      <td>${escapeHtml(s.label)}</td>
      <td><strong>${escapeHtml(s.value)}/100</strong></td>
    </tr>`
    )
    .join('');

  const riskRows = data.riskBreakdown
    .map(
      (r) => `
    <tr>
      <td>${escapeHtml(r.label)}</td>
      <td>${escapeHtml(r.level)}</td>
      <td>${escapeHtml(r.score)}/100</td>
    </tr>`
    )
    .join('');

  const chartSections =
    data.charts?.length ?
      `
  <h2>Charts</h2>
  ${data.charts
    .map(
      (chart) => `
  <div class="chart-block">
    <h3>${escapeHtml(chart.title)}</h3>
    <div class="chart-wrap">${chart.svgHtml}</div>
  </div>`
    )
    .join('')}`
    : '';

  const vitalSections = data.vitals
    .map((v) => {
      const readingRows = v.readings
        .map(
          (r) => `
        <tr>
          <td>${escapeHtml(r.time)}</td>
          <td>${escapeHtml(r.display)}</td>
        </tr>`
        )
        .join('');

      return `
      <h2>${escapeHtml(v.label)}</h2>
      <div class="stats">
        <div class="stat"><div class="stat-label">Latest</div><div class="stat-value">${escapeHtml(v.latest)} <small>${escapeHtml(v.unit)}</small></div></div>
        <div class="stat"><div class="stat-label">Average</div><div class="stat-value">${escapeHtml(v.avg)} <small>${escapeHtml(v.unit)}</small></div></div>
        <div class="stat"><div class="stat-label">Min</div><div class="stat-value">${escapeHtml(v.min)} <small>${escapeHtml(v.unit)}</small></div></div>
        <div class="stat"><div class="stat-label">Max</div><div class="stat-value">${escapeHtml(v.max)} <small>${escapeHtml(v.unit)}</small></div></div>
        <div class="stat"><div class="stat-label">Trend</div><div class="stat-value">${escapeHtml(v.trend)}%</div></div>
      </div>
      <table>
        <thead><tr><th>Time</th><th>Reading</th></tr></thead>
        <tbody>${readingRows || '<tr><td colspan="2" class="empty">No readings</td></tr>'}</tbody>
      </table>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Health KPI Report — ${escapeHtml(patientLabel)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; color: #111827; margin: 0; padding: 32px; line-height: 1.5; }
    h1 { font-size: 1.5rem; margin: 0 0 4px; }
    h2 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #374151; margin: 28px 0 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
    .meta { color: #6b7280; font-size: 0.875rem; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; margin-bottom: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; }
    th { background: #f9fafb; font-weight: 700; }
    .empty { text-align: center; color: #9ca3af; font-style: italic; }
    .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 10px; }
    .stat { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; text-align: center; }
    .stat-label { font-size: 0.65rem; text-transform: uppercase; color: #6b7280; font-weight: 700; }
    .stat-value { font-size: 1.1rem; font-weight: 800; margin-top: 4px; }
    h3 { font-size: 0.875rem; margin: 0 0 8px; color: #374151; }
    .chart-block { margin: 20px 0 28px; page-break-inside: avoid; }
    .chart-wrap { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; background: #fff; overflow: hidden; }
    .chart-wrap svg { display: block; width: 100%; height: auto; max-height: 360px; }
    @media print {
      body { padding: 16px; }
      h2 { page-break-after: avoid; }
      table { page-break-inside: avoid; }
      .chart-block { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>Health KPI Report</h1>
  <p class="meta">
    <strong>${escapeHtml(patientLabel)}</strong>
    ${data.userId ? ` · ID ${escapeHtml(data.userId)}` : ''}
    <br />Generated: ${escapeHtml(data.generatedAt)}
  </p>

  <h2>Summary KPIs</h2>
  <table>
    <thead><tr><th>Metric</th><th>Value</th><th>Change</th></tr></thead>
    <tbody>${heroRows}</tbody>
  </table>

  <h2>System Health Scores</h2>
  <table>
    <thead><tr><th>System</th><th>Score</th></tr></thead>
    <tbody>${systemRows}</tbody>
  </table>

  <h2>Risk Breakdown</h2>
  <table>
    <thead><tr><th>Category</th><th>Level</th><th>Score</th></tr></thead>
    <tbody>${riskRows}</tbody>
  </table>

  ${chartSections}

  <h2>Vital Sign Trends (24h)</h2>
  ${vitalSections}
</body>
</html>`;
}

function defaultFilename(data: HealthKpisReportData): string {
  const date = new Date().toISOString().slice(0, 10);
  const id = data.userId ?? 'patient';
  return `health-kpis-${id}-${date}.html`;
}

export function downloadHealthKpisReport(data: HealthKpisReportData): void {
  const html = buildHealthKpisReportHtml(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = defaultFilename(data);
  link.click();
  URL.revokeObjectURL(url);
}

export function printHealthKpisReportAsPdf(data: HealthKpisReportData): void {
  printHtmlReport(buildHealthKpisReportHtml(data));
}
