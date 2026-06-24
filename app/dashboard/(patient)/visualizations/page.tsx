"use client";

import React from "react";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const mockData = [
  { time: "08:00", heartRate: 72, spo2: 98, bpSystolic: 120, bpDiastolic: 80 },
  { time: "09:00", heartRate: 75, spo2: 97, bpSystolic: 122, bpDiastolic: 82 },
  { time: "10:00", heartRate: 80, spo2: 98, bpSystolic: 125, bpDiastolic: 85 },
  { time: "11:00", heartRate: 78, spo2: 99, bpSystolic: 121, bpDiastolic: 81 },
  { time: "12:00", heartRate: 85, spo2: 96, bpSystolic: 128, bpDiastolic: 88 },
  { time: "13:00", heartRate: 74, spo2: 98, bpSystolic: 119, bpDiastolic: 79 },
  { time: "14:00", heartRate: 70, spo2: 99, bpSystolic: 115, bpDiastolic: 75 },
];

export default function VisualizationsPage() {
  const { t } = useTranslation();
  return (
    <PageContainer scrollable>
      <div className="space-y-6">
        <Heading
          title={t('visualizations')}
          description={t('visualizations_description', 'Detailed view of your health metrics over time.')}
        />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Heart Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t('heart_rate')} (BPM)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockData}>
                    <defs>
                      <linearGradient id="colorHeart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" />
                    <YAxis domain={["dataMin - 5", "dataMax + 5"]} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="heartRate"
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill="url(#colorHeart)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* SpO2 Chart */}
          <Card>
            <CardHeader>
              <CardTitle>SpO2 (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" />
                    <YAxis domain={[90, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="spo2"
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Blood Pressure Chart */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t('blood_pressure')} (mmHg)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" />
                    <YAxis domain={["dataMin - 10", "dataMax + 10"]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="bpSystolic"
                      stroke="#8b5cf6"
                      name="Systolic"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="bpDiastolic"
                      stroke="#10b981"
                      name="Diastolic"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
