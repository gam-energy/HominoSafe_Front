import type { ApplicationStatus } from '../types/applications';
import { APPLICATION_TIMELINE } from '../types/applications';

export function personDisplayName(person?: {
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
} | null): string {
  if (!person) return '—';
  const name = [person.first_name, person.last_name].filter(Boolean).join(' ').trim();
  return name || person.username || '—';
}

export function statusLabelKey(status: ApplicationStatus): string {
  return `app_status_${status}`;
}

/** Index of status in the happy-path timeline; rejected is special-cased. */
export function timelineStepIndex(status: ApplicationStatus): number {
  if (status === 'rejected') return -1;
  const idx = APPLICATION_TIMELINE.indexOf(status);
  return idx >= 0 ? idx : 0;
}

export function formatMoney(
  amount?: number | null,
  currency?: string | null
): string {
  if (amount == null) return '—';
  const cur = currency || 'IRR';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: cur.length === 3 ? cur : 'IRR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${cur}`;
  }
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export function isReceiptFileValid(file: File): { ok: true } | { ok: false; reason: string } {
  const max = 5 * 1024 * 1024;
  if (file.size > max) {
    return { ok: false, reason: 'File must be 5MB or smaller' };
  }
  const allowed = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];
  if (file.type && !allowed.includes(file.type)) {
    return { ok: false, reason: 'Only images or PDF are allowed' };
  }
  return { ok: true };
}
