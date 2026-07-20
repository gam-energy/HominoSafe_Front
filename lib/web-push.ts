import axiosInstance from '@/api/axiosInstance';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export type WebPushSupport =
  | 'ok'
  | 'insecure'
  | 'unsupported'
  | 'denied'
  | 'disabled'
  | 'no_service_worker';

export function getWebPushBlocker(): Exclude<WebPushSupport, 'ok' | 'denied' | 'disabled'> | null {
  if (typeof window === 'undefined') return 'unsupported';
  if (!window.isSecureContext) return 'insecure';
  if (!('serviceWorker' in navigator)) return 'no_service_worker';
  if (!('PushManager' in window) || !('Notification' in window)) return 'unsupported';
  return null;
}

export async function fetchVapidPublicKey(): Promise<string | null> {
  const { data } = await axiosInstance.get<{ public_key: string | null; enabled: boolean }>(
    '/notifications/push/vapid-public-key',
  );
  return data.enabled && data.public_key ? data.public_key : null;
}

async function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) {
    await navigator.serviceWorker.ready;
    return existing;
  }
  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;
  return reg;
}

/** Opt into browser/PWA Web Push (non-Synapse). */
export async function enableWebPush(): Promise<WebPushSupport> {
  const blocker = getWebPushBlocker();
  if (blocker) return blocker;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';

  const publicKey = await fetchVapidPublicKey();
  if (!publicKey) return 'disabled';

  const reg = await ensureServiceWorker();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }
  const json = sub.toJSON();
  await axiosInstance.post('/notifications/push/subscribe', {
    endpoint: json.endpoint,
    keys: json.keys,
    user_agent: navigator.userAgent,
  });
  return 'ok';
}

export async function disableWebPush(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await axiosInstance.post('/notifications/push/unsubscribe', { endpoint: sub.endpoint });
  await sub.unsubscribe();
}
