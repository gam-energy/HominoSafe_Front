'use client';

import { useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { getWsBaseUrl } from '@/lib/api-utils';

/**
 * While `enabled`, subscribe to `/ws/device/login/notification` and invoke
 * `onSuccess` when the watch completes OTP login (`DEVICE_LOGIN_SUCCESS`).
 */
export function useDeviceLoginWebSocket(
  enabled: boolean,
  onSuccess: (deviceId?: string | null) => void
) {
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (!enabled) return;

    const token = Cookies.get('access_token');
    if (!token) return;

    const url = `${getWsBaseUrl()}/ws/device/login/notification?token=${encodeURIComponent(token)}`;
    let closedByUs = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let ws: WebSocket | null = null;

    const attach = (socket: WebSocket) => {
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.type === 'DEVICE_LOGIN_SUCCESS') {
            const deviceId =
              data?.payload?.device_id ?? data?.device_id ?? null;
            onSuccessRef.current(
              typeof deviceId === 'string' ? deviceId : null
            );
          }
        } catch {
          /* ignore malformed frames */
        }
      };
      socket.onclose = () => {
        if (closedByUs) return;
        reconnectTimer = setTimeout(open, 2000);
      };
    };

    const open = () => {
      try {
        ws = new WebSocket(url);
        attach(ws);
      } catch {
        /* give up until effect re-runs */
      }
    };

    open();

    return () => {
      closedByUs = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [enabled]);
}
