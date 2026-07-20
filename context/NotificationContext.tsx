"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AlertData,
  BehaviorAlertType,
  SmartSensorType,
} from '@/features/dashboard/types/patient/alert';
import { fetchActiveAlerts } from '@/features/alert/api/alertApi';
import { mapBackendAlert } from '@/features/alert/lib/alertTypeMap';

interface NotificationContextType {
  notifications: AlertData[];
  unreadCount: number;
  addNotification: (notification: AlertData) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<AlertData[]>([]);

  // Seed from the real /alert/active endpoint on mount, then poll every 30s.
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const alerts = await fetchActiveAlerts();
        if (!active) return;
        const mapped: AlertData[] = alerts.map((b) => {
          const ui = mapBackendAlert(b);
          return {
            id: String(ui.alertId),
            timestamp: ui.timestamp,
            alert_type: (ui.alertType as BehaviorAlertType) || 'sensor_event',
            severity: (ui.severity?.toUpperCase() || 'MEDIUM') as AlertData['severity'],
            message: ui.message || `${ui.alertType.replace(/_/g, ' ')}`,
            location: ui.vision?.source ? `${ui.vision.source}` : undefined,
            related_sensors: ui.sensorData ? (Object.keys(ui.sensorData).filter(Boolean) as SmartSensorType[]) : [],
            details: ui.aiModelOutput ? { confidence: ui.aiModelOutput.confidence } : undefined,
            read: false,
            sensor: undefined,
            sensor_icon: undefined,
          };
        });
        setNotifications(
          mapped.sort((a, b) => {
            const rank: Record<string, number> = {
              CRITICAL: 4,
              HIGH: 3,
              MEDIUM: 2,
              LOW: 1,
            };
            const d = (rank[b.severity] || 0) - (rank[a.severity] || 0);
            if (d !== 0) return d;
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          }),
        );
      } catch {
        // leave empty — header bell will show 0
      }
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const addNotification = (notification: AlertData) => {
    setNotifications((prev) => [notification, ...prev].slice(0, 20));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        removeNotification,
        markAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
