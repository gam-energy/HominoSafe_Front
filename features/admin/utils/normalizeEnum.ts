// Case-flexible enum handling for admin endpoints.
// The backend spec uses UPPERCASE values (DOCTOR, ACTIVE, CREATED) while the
// existing frontend code mixes lowercase and uppercase. These helpers let us
// accept either form and produce a canonical UPPERCASE value for comparisons.

export type AdminRole = 'ADMIN' | 'DOCTOR' | 'CAREGIVER' | 'PATIENT' | '';
export type AdminStatus = 'ACTIVE' | 'INACTIVE' | '';
export type SynapseStatus = 'PENDING' | 'CREATED' | 'FAILED' | '';

const toUpper = (v: unknown): string =>
  typeof v === 'string' ? v.trim().toUpperCase() : '';

export const normRole = (v: unknown): AdminRole => {
  const r = toUpper(v);
  if (r === 'ADMIN' || r === 'DOCTOR' || r === 'CAREGIVER' || r === 'PATIENT') {
    return r;
  }
  return '';
};

export const normStatus = (v: unknown): AdminStatus => {
  const s = toUpper(v);
  if (s === 'ACTIVE' || s === 'INACTIVE') return s;
  return '';
};

export const normSynapse = (v: unknown): SynapseStatus => {
  const s = toUpper(v);
  if (s === 'PENDING' || s === 'CREATED' || s === 'FAILED') return s;
  return '';
};

export const isRole = (v: unknown, role: string): boolean =>
  normRole(v) === role.trim().toUpperCase();

export const isStatus = (v: unknown, status: string): boolean =>
  normStatus(v) === status.trim().toUpperCase();

export const isActive = (v: unknown): boolean => normStatus(v) === 'ACTIVE';
export const isInactive = (v: unknown): boolean => normStatus(v) === 'INACTIVE';
export const isSynapseFailed = (v: unknown): boolean =>
  normSynapse(v) === 'FAILED';
export const isSynapsePending = (v: unknown): boolean =>
  normSynapse(v) === 'PENDING';
export const isSynapseCreated = (v: unknown): boolean =>
  normSynapse(v) === 'CREATED';

// Stable CSS class tokens keyed by canonical role. Returns the existing
// lowercase-class styling already used across the app so visual consistency
// is preserved regardless of which case the backend returns.
export const roleBadgeClass = (v: unknown): string => {
  switch (normRole(v)) {
    case 'DOCTOR':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'CAREGIVER':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    case 'PATIENT':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'ADMIN':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
};

export const statusBadgeClass = (v: unknown): string => {
  switch (normStatus(v)) {
    case 'ACTIVE':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'INACTIVE':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
};

export const synapseBadgeClass = (v: unknown): string => {
  switch (normSynapse(v)) {
    case 'CREATED':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'PENDING':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    case 'FAILED':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
};

// Display label (Title Case) for badges / headings.
export const roleLabel = (v: unknown): string => {
  const r = normRole(v);
  return r ? r.charAt(0) + r.slice(1).toLowerCase() : 'Unknown';
};

export const statusLabel = (v: unknown): string => {
  const s = normStatus(v);
  return s ? s.charAt(0) + s.slice(1).toLowerCase() : '—';
};

export const synapseLabel = (v: unknown): string => {
  const s = normSynapse(v);
  return s ? s.charAt(0) + s.slice(1).toLowerCase() : '—';
};
