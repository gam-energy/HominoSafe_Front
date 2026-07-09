import { printHtmlReport } from '@/lib/export/printHtmlReport';

export type MedicalProfileReportComorbidity = {
  label: string;
  value: string;
};

export type MedicalProfileReportMedication = {
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  notes?: string;
  active: boolean;
};

export type MedicalProfileReportSymptom = {
  name: string;
  severity: string;
  onsetDate?: string;
  notes?: string;
};

export type MedicalProfileReportData = {
  pageTitle: string;
  patientName: string;
  userId?: number;
  ehrId?: number;
  generatedAt: string;
  lastUpdated?: string;
  demographics: string;
  diagnosis: string;
  physicianNotes: string;
  comorbidities: MedicalProfileReportComorbidity[];
  medications: MedicalProfileReportMedication[];
  symptoms: MedicalProfileReportSymptom[];
  stats: {
    conditions: number;
    medications: number;
    symptoms: number;
  };
};

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function severityClass(severity: string): string {
  const s = severity.toLowerCase();
  if (s.includes('high') || s.includes('severe') || s.includes('critical')) {
    return 'badge badge-high';
  }
  if (s.includes('moderate') || s.includes('medium')) {
    return 'badge badge-moderate';
  }
  return 'badge badge-low';
}

export function buildMedicalProfileReportHtml(data: MedicalProfileReportData): string {
  const comorbidityHtml =
    data.comorbidities.length === 0
      ? '<p class="empty">No comorbidities recorded.</p>'
      : `<div class="chip-grid">${data.comorbidities
          .map(
            (c) => `
        <div class="chip">
          <span class="chip-label">${escapeHtml(c.label)}</span>
          <span class="chip-value">${escapeHtml(c.value || '—')}</span>
        </div>`
          )
          .join('')}</div>`;

  const medicationsHtml =
    data.medications.length === 0
      ? '<p class="empty">No medications recorded.</p>'
      : `<div class="med-grid">${data.medications
          .map(
            (m) => `
        <div class="med-card">
          <div class="med-head">
            <strong>${escapeHtml(m.name)}</strong>
            <span class="badge ${m.active ? 'badge-active' : 'badge-ended'}">${m.active ? 'Active' : 'Ended'}</span>
          </div>
          <div class="med-meta">
            <span><em>Dosage</em> ${escapeHtml(m.dosage)}</span>
            <span><em>Frequency</em> ${escapeHtml(m.frequency)}</span>
            <span><em>Start</em> ${escapeHtml(m.startDate)}</span>
            <span><em>End</em> ${escapeHtml(m.endDate)}</span>
          </div>
          ${m.notes ? `<p class="med-notes">${escapeHtml(m.notes)}</p>` : ''}
        </div>`
          )
          .join('')}</div>`;

  const symptomsHtml =
    data.symptoms.length === 0
      ? '<p class="empty">No symptoms recorded.</p>'
      : `<table class="symptoms-table">
        <thead><tr><th>Symptom</th><th>Severity</th><th>Onset</th><th>Notes</th></tr></thead>
        <tbody>${data.symptoms
          .map(
            (s) => `
          <tr>
            <td><strong>${escapeHtml(s.name)}</strong></td>
            <td><span class="${severityClass(s.severity)}">${escapeHtml(s.severity)}</span></td>
            <td>${escapeHtml(s.onsetDate || '—')}</td>
            <td class="notes-cell">${escapeHtml(s.notes || '—')}</td>
          </tr>`
          )
          .join('')}</tbody>
      </table>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(data.pageTitle)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 0;
      line-height: 1.55;
      background: #f1f5f9;
    }
    .page { max-width: 920px; margin: 0 auto; padding: 28px 24px 40px; }
    .hero {
      background: linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 45%, #14b8a6 100%);
      color: #fff;
      border-radius: 20px;
      padding: 28px 32px;
      margin-bottom: 24px;
      box-shadow: 0 20px 40px rgba(29, 78, 216, 0.18);
    }
    .hero-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
    .hero-title { font-size: 1.75rem; font-weight: 800; margin: 0; letter-spacing: -0.02em; }
    .hero-sub { margin: 6px 0 0; opacity: 0.9; font-size: 0.9rem; }
    .ehr-pill {
      background: rgba(255,255,255,0.18);
      border: 1px solid rgba(255,255,255,0.35);
      border-radius: 999px;
      padding: 6px 14px;
      font-size: 0.75rem;
      font-weight: 700;
      font-family: ui-monospace, monospace;
      backdrop-filter: blur(4px);
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 22px;
    }
    .stat {
      background: rgba(255,255,255,0.14);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 14px;
      padding: 14px;
      text-align: center;
    }
    .stat-num { font-size: 1.75rem; font-weight: 800; line-height: 1; }
    .stat-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.85; margin-top: 6px; font-weight: 700; }
    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 20px;
      font-size: 0.8125rem;
      color: #64748b;
      margin-bottom: 20px;
      padding: 0 4px;
    }
    .section {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 22px 24px;
      margin-bottom: 16px;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 800;
      color: #475569;
      margin: 0 0 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    .section-title.blue { color: #1d4ed8; border-color: #bfdbfe; }
    .section-title.emerald { color: #059669; border-color: #a7f3d0; }
    .section-title.amber { color: #d97706; border-color: #fde68a; }
    .section-title.rose { color: #e11d48; border-color: #fecdd3; }
    .section-title.violet { color: #7c3aed; border-color: #ddd6fe; }
    .body-text { margin: 0; font-size: 0.9375rem; color: #1e293b; }
    .highlight {
      background: linear-gradient(90deg, #ecfdf5, #f0fdf4);
      border: 1px solid #a7f3d0;
      border-radius: 12px;
      padding: 14px 16px;
      font-weight: 600;
    }
    .quote {
      border-left: 4px solid #f59e0b;
      background: #fffbeb;
      border-radius: 0 12px 12px 0;
      padding: 14px 18px;
      font-style: italic;
      color: #78350f;
      margin: 0;
    }
    .chip-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .chip {
      border: 1px solid #fecdd3;
      background: #fff1f2;
      border-radius: 12px;
      padding: 12px 14px;
    }
    .chip-label { display: block; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 800; color: #e11d48; margin-bottom: 4px; }
    .chip-value { font-size: 0.875rem; font-weight: 600; color: #1e293b; }
    .med-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .med-card {
      border: 1px solid #dbeafe;
      background: #f8fafc;
      border-radius: 14px;
      padding: 14px 16px;
    }
    .med-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 10px; }
    .med-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; font-size: 0.78rem; color: #475569; }
    .med-meta em { font-style: normal; font-weight: 700; color: #64748b; display: block; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .med-notes { margin: 10px 0 0; font-size: 0.78rem; font-style: italic; color: #64748b; border-left: 2px solid #3b82f6; padding-left: 10px; }
    .symptoms-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
    .symptoms-table th, .symptoms-table td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; vertical-align: top; }
    .symptoms-table th { background: #f8fafc; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; }
    .notes-cell { color: #64748b; font-style: italic; max-width: 200px; }
    .badge {
      display: inline-block;
      border-radius: 999px;
      padding: 3px 10px;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: capitalize;
      border: 1px solid transparent;
    }
    .badge-active { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
    .badge-ended { background: #f1f5f9; color: #64748b; border-color: #e2e8f0; }
    .badge-low { background: #dcfce7; color: #166534; }
    .badge-moderate { background: #fef3c7; color: #92400e; }
    .badge-high { background: #ffe4e6; color: #be123c; }
    .empty { color: #94a3b8; font-style: italic; margin: 0; font-size: 0.875rem; }
    .footer {
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 0.75rem;
      color: #94a3b8;
      text-align: center;
    }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media print {
      body { background: #fff; }
      .page { padding: 12px; max-width: none; }
      .hero { box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .section { box-shadow: none; page-break-inside: avoid; }
    }
    @media (max-width: 640px) {
      .stats, .chip-grid, .med-grid, .two-col { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="page">
    <header class="hero">
      <div class="hero-top">
        <div>
          <h1 class="hero-title">${escapeHtml(data.pageTitle)}</h1>
          <p class="hero-sub">${escapeHtml(data.patientName)}${data.userId ? ` · Patient ID ${escapeHtml(data.userId)}` : ''}</p>
        </div>
        ${data.ehrId ? `<span class="ehr-pill">EHR #${escapeHtml(data.ehrId)}</span>` : ''}
      </div>
      <div class="stats">
        <div class="stat"><div class="stat-num">${escapeHtml(data.stats.conditions)}</div><div class="stat-label">Conditions</div></div>
        <div class="stat"><div class="stat-num">${escapeHtml(data.stats.medications)}</div><div class="stat-label">Medications</div></div>
        <div class="stat"><div class="stat-num">${escapeHtml(data.stats.symptoms)}</div><div class="stat-label">Symptoms</div></div>
      </div>
    </header>

    <div class="meta-bar">
      <span>Generated: <strong>${escapeHtml(data.generatedAt)}</strong></span>
      ${data.lastUpdated ? `<span>Record updated: <strong>${escapeHtml(data.lastUpdated)}</strong></span>` : ''}
    </div>

    <div class="two-col">
      <section class="section">
        <h2 class="section-title blue">Demographics</h2>
        <p class="body-text">${escapeHtml(data.demographics || 'Not recorded')}</p>
      </section>
      <section class="section">
        <h2 class="section-title emerald">Diagnosis</h2>
        ${data.diagnosis ? `<div class="highlight">${escapeHtml(data.diagnosis)}</div>` : '<p class="empty">No diagnosis recorded.</p>'}
      </section>
    </div>

    <section class="section">
      <h2 class="section-title rose">Comorbidities</h2>
      ${comorbidityHtml}
    </section>

    <section class="section">
      <h2 class="section-title amber">Physician Notes</h2>
      ${data.physicianNotes ? `<blockquote class="quote">${escapeHtml(data.physicianNotes)}</blockquote>` : '<p class="empty">No notes available.</p>'}
    </section>

    <section class="section">
      <h2 class="section-title blue">Medications</h2>
      ${medicationsHtml}
    </section>

    <section class="section">
      <h2 class="section-title violet">Symptoms</h2>
      ${symptomsHtml}
    </section>

    <p class="footer">SenioSentry / SenioSentry — Confidential medical record. For authorized care use only.</p>
  </div>
</body>
</html>`;
}

function defaultFilename(data: MedicalProfileReportData): string {
  const date = new Date().toISOString().slice(0, 10);
  const slug = data.patientName.replace(/\s+/g, '-').toLowerCase() || 'patient';
  return `medical-profile-${slug}-${date}.html`;
}

export function downloadMedicalProfileReport(data: MedicalProfileReportData): void {
  const html = buildMedicalProfileReportHtml(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = defaultFilename(data);
  link.click();
  URL.revokeObjectURL(url);
}

export function printMedicalProfileReportAsPdf(data: MedicalProfileReportData): void {
  printHtmlReport(buildMedicalProfileReportHtml(data));
}
