"use client";

import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  AlertData,
  BehaviorAlertType,
  SmartSensorType,
} from '@/features/dashboard/types/patient/alert';

interface NotificationContextType {
  notifications: AlertData[];
  unreadCount: number;
  addNotification: (notification: AlertData) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

const sampleAlerts: AlertData[] = [
  {
    id: 'alert-ortho-001',
    timestamp: '2026-01-20T07:12:30Z',
    alert_type: 'predicted_orthostatic_hypotension' as BehaviorAlertType,
    severity: 'MEDIUM',
    message: 'Predicted blood pressure instability following morning postural change',
    location: 'Bedroom',
    related_sensors: ['bp', 'heart_rate', 'activity'] as SmartSensorType[],
    details: {
      duration: 45 * 60,
      confidence: 0.91,
    },
    read: false,
    sensor: undefined,
    sensor_icon: undefined,
  },
  {
    id: 'alert-hr-002',
    timestamp: '2026-01-20T06:45:00Z',
    alert_type: 'possible_fall' as BehaviorAlertType,
    severity: 'HIGH',
    message: 'Heart rate spike detected — 104 bpm during hallway activity',
    location: 'Hallway',
    read: false,
    sensor: 'heart_rate',
    sensor_icon: undefined,
  },
  {
    id: 'alert-spo2-003',
    timestamp: '2026-01-19T22:10:00Z',
    alert_type: 'sensor_event' as BehaviorAlertType,
    severity: 'LOW',
    message: 'SpO₂ briefly dropped to 94% — recovered within 5 minutes',
    location: 'Bedroom',
    read: true,
    sensor: 'spo2',
    sensor_icon: undefined,
  },
];

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<AlertData[]>(sampleAlerts);

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
