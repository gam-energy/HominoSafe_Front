function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

/**
 * Resolve API base URL for the browser.
 * - HTTPS (TLS proxy): same-origin (empty) so /token hits nginx → API
 * - HTTP :3000 direct Next: talk to API on :8888 on the same host
 * - SSR / build fallback: NEXT_PUBLIC_API_URL
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    if (protocol === 'https:') {
      return '';
    }
    // Direct frontend container / compose port mapping
    if (port === '3000') {
      return `http://${hostname}:8888`;
    }
  }

  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) {
    return trimTrailingSlash(configured);
  }
  return 'http://127.0.0.1:8888';
}

export function getWsBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return `wss://${window.location.host}`;
  }
  const apiUrl = getApiBaseUrl() ||
    (typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8888');
  const parsed = new URL(apiUrl, typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1');
  const protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${parsed.host}`;
}

export function getChatWsUrl(sessionId: string, token: string): string {
  return `${getWsBaseUrl()}/api/v1/chatbot/ws/chat/${sessionId}?token=${encodeURIComponent(token)}`;
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
