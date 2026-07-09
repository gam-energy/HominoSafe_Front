import type { AxiosError } from 'axios';

interface BackendErrorDetail {
  detail?: string | Array<{ msg?: string; message?: string }>;
}

const SYNAPSE_TOKEN_MESSAGE =
  'Synapse admin operations require SYNAPSE_ADMIN_TOKEN to be configured.';

export const isSynapseTokenMissing = (err: unknown): boolean => {
  const e = err as AxiosError<BackendErrorDetail>;
  return e?.response?.status === 503;
};

export const extractErrorMessage = (err: unknown, fallback: string): string => {
  const e = err as AxiosError<BackendErrorDetail>;
  const detail = e?.response?.data?.detail;

  if (Array.isArray(detail)) {
    const parts = detail
      .map((d) => d?.msg ?? d?.message)
      .filter((m): m is string => typeof m === 'string' && m.length > 0);
    if (parts.length) return parts.join(' | ');
  }

  if (typeof detail === 'string' && detail.length) return detail;

  if (e?.response?.status === 503) return SYNAPSE_TOKEN_MESSAGE;

  if (typeof e?.message === 'string' && e.message.length) return e.message;

  return fallback;
};
