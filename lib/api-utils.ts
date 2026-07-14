/**
 * Browser calls same origin (:3000). Next.js rewrites proxy to FastAPI.
 * SSR fallback still uses NEXT_PUBLIC_API_URL when set.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '';
  }
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  return 'http://127.0.0.1:8888';
}

export function getWsBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}`;
  }
  const apiUrl = getApiBaseUrl();
  const parsed = new URL(apiUrl);
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
