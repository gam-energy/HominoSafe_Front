import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Client-side style JWT exp check (no signature verify) for redirect guards. */
function isJwtExpired(token: string, skewMs = 30_000): boolean {
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

function clearAuthCookies(response: NextResponse): void {
  for (const key of ['access_token', 'refresh_token', 'synapse_access_token']) {
    response.cookies.set(key, '', { path: '/', maxAge: 0 });
  }
}

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  const pathname = request.nextUrl.pathname;
  const tokenExpired = accessToken ? isJwtExpired(accessToken) : true;
  const hasFreshAccess = Boolean(accessToken) && !tokenExpired;

  // Expired cookie must not bounce /auth ↔ /dashboard forever.
  if (pathname.startsWith('/auth')) {
    if (hasFreshAccess) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (accessToken && tokenExpired) {
      const res = NextResponse.next();
      clearAuthCookies(res);
      return res;
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard')) {
    if (!accessToken) {
      return NextResponse.redirect(new URL('/auth/sign-in', request.url));
    }
    // Allow expired access onto dashboard so the client can refresh once.
    // If refresh fails, axios clears cookies and replaces to /auth/sign-in.
    return NextResponse.next();
  }

  if (pathname.startsWith('/application-status')) {
    if (!accessToken) {
      return NextResponse.redirect(new URL('/auth/sign-in', request.url));
    }
    return NextResponse.next();
  }

  // Public landing — do not redirect authenticated users away from '/'.
  if (pathname === '/') {
    if (accessToken && tokenExpired) {
      const res = NextResponse.next();
      clearAuthCookies(res);
      return res;
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/auth/:path*',
    '/dashboard/:path*',
    '/application-status',
    '/application-status/:path*',
  ],
};
