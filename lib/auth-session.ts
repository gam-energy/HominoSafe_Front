import Cookies from 'js-cookie';

/** Must match how login cookies are written so remove/clear works. */
export const AUTH_COOKIE_OPTS = {
  path: '/',
  secure: false,
  sameSite: 'Lax' as const,
};

export function clearAuthCookies(): void {
  const keys = ['access_token', 'refresh_token', 'synapse_access_token'] as const;
  for (const key of keys) {
    Cookies.remove(key, { path: '/' });
    Cookies.remove(key); // legacy cookies without explicit path
  }
}

/** Decode JWT payload without verifying signature (client-side expiry check only). */
export function isJwtExpired(token: string, skewMs = 30_000): boolean {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return true;
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    if (typeof payload.exp !== 'number') return false;
    return payload.exp * 1000 <= Date.now() + skewMs;
  } catch {
    return true;
  }
}

/**
 * Clear session and land on sign-in once.
 * Avoids the middleware bounce loop when an expired access cookie remains.
 */
export function redirectToSignIn(): void {
  if (typeof window === 'undefined') return;

  clearAuthCookies();

  const path = window.location.pathname || '';
  if (path.startsWith('/auth')) return;

  try {
    if (sessionStorage.getItem('auth_redirecting') === '1') return;
    sessionStorage.setItem('auth_redirecting', '1');
  } catch {
    // ignore storage errors
  }

  window.location.replace('/auth/sign-in');
}

/** Call on successful login / auth pages so a later expiry can redirect again. */
export function clearAuthRedirectGuard(): void {
  try {
    sessionStorage.removeItem('auth_redirecting');
  } catch {
    // ignore
  }
}
