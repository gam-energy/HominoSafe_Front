'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { getWsBaseUrl } from '@/lib/api-utils';
import { AlertType, BackendAlert, BackendAlertPayload } from '../types/AlertSchema';
import { mapBackendAlert, mapBackendPayload, compareAlertsBySeverityThenTime } from '../lib/alertTypeMap';
import { fetchAlertHistory } from '../api/alertApi';

export type AlertConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

interface UseAlertWebSocketResult {
  alerts: AlertType[];
  status: AlertConnectionStatus;
  /** Merge/replace an alert locally (e.g. after an acknowledge action). */
  upsertAlert: (alert: AlertType) => void;
}

const RECONNECT_DELAY_MS = 3000;

/**
 * Subscribe to live alerts over the backend Redis-backed WebSocket
 * (`/alert/ws`). Handles the active-alerts snapshot on connect, individual
 * SYSTEM_ALERT pushes, and automatic reconnection. Falls back to a REST
 * history fetch so the panel is populated even before the first push.
 */
export function useAlertWebSocket(): UseAlertWebSocketResult {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [status, setStatus] = useState<AlertConnectionStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedByUs = useRef(false);

  const upsertAlert = useCallback((alert: AlertType) => {
    setAlerts((prev) => {
      const idx = prev.findIndex((a) => a.alertId === alert.alertId);
      if (idx === -1) {
        return [alert, ...prev].sort(compareAlertsBySeverityThenTime);
      }
      const next = [...prev];
      const existing = next[idx];
      next[idx] = {
        ...existing,
        ...alert,
        // Keep previously known vitals if this update omitted them.
        sensorData: alert.sensorData ?? existing.sensorData,
      };
      return next.sort(compareAlertsBySeverityThenTime);
    });
  }, []);

  const mergeMany = useCallback((incoming: AlertType[]) => {
    setAlerts((prev) => {
      const byId = new Map(prev.map((a) => [a.alertId, a]));
      for (const a of incoming) {
        const existing = byId.get(a.alertId);
        byId.set(a.alertId, {
          ...existing,
          ...a,
          sensorData: a.sensorData ?? existing?.sensorData,
        });
      }
      return Array.from(byId.values()).sort(compareAlertsBySeverityThenTime);
    });
  }, []);

  const connect = useCallback(() => {
    const token = Cookies.get('access_token');
    if (!token) {
      setStatus('error');
      return;
    }

    const url = `${getWsBaseUrl()}/alert/ws?token=${encodeURIComponent(token)}`;
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      setStatus('error');
      return;
    }
    wsRef.current = ws;
    setStatus('connecting');

    ws.onopen = () => setStatus('connected');

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === 'CONNECTION_ESTABLISHED') {
          setStatus('connected');
          return;
        }
        if (data?.type === 'ACTIVE_ALERTS_SNAPSHOT' && Array.isArray(data.alerts)) {
          mergeMany((data.alerts as BackendAlert[]).map(mapBackendAlert));
          return;
        }
        if (data?.type === 'SYSTEM_ALERT' && data.payload) {
          upsertAlert(mapBackendPayload(data.payload as BackendAlertPayload));
          return;
        }
        // Some brokers may relay the bare AlertResponse; handle defensively.
        if (data?.id && data?.severity) {
          upsertAlert(mapBackendAlert(data as BackendAlert));
        }
      } catch {
        /* ignore malformed frames */
      }
    };

    ws.onerror = () => setStatus('error');

    ws.onclose = () => {
      setStatus('disconnected');
      if (!closedByUs.current) {
        reconnectRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };
  }, [mergeMany, upsertAlert]);

  useEffect(() => {
    closedByUs.current = false;

    // Seed from REST so the panel isn't empty before the first push.
    fetchAlertHistory({ limit: 50 })
      .then((rows) => mergeMany(rows.map(mapBackendAlert)))
      .catch(() => {
        /* ignore; websocket snapshot will populate */
      });

    connect();

    return () => {
      closedByUs.current = true;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect, mergeMany]);

  return { alerts, status, upsertAlert };
}
