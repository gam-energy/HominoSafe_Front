"use client";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  TimeScale
);

/* ================= TYPES ================= */

export type Metric =
  | "heart_rate"
  | "spo2"
  | "bp_systolic"
  | "bp_diastolic"
  | "temperature"
  | "body_temperature"
  | "humidity"
  | "mq2";

export type TimePeriod = "day" | "week" | "month";

type HistoryDataPoint = {
  timestamp: string;
  value: number;
};

type HistoryChartProps = {
  data: HistoryDataPoint[];
  metric: Metric;
  timePeriod: TimePeriod;
  unit?: string;
  className?: string;
  setMetric: (metric: Metric) => void;
  setTimePeriod: (period: TimePeriod) => void;
};

/* ================= CONSTANTS ================= */

const METRIC_OPTIONS: { label: string; value: Metric }[] = [
  { label: "Heart Rate", value: "heart_rate" },
  { label: "SpO₂", value: "spo2" },
  { label: "BP Systolic", value: "bp_systolic" },
  { label: "BP Diastolic", value: "bp_diastolic" },
  { label: "Temperature", value: "temperature" },
  { label: "Body Temperature", value: "body_temperature" },
  { label: "Humidity", value: "humidity" },
  { label: "MQ2", value: "mq2" },
];

const TIME_OPTIONS: { label: string; value: TimePeriod }[] = [
  { label: "Last Day", value: "day" },
  { label: "Last Week", value: "week" },
  { label: "Last Month", value: "month" },
];

/* ================= COMPONENT ================= */

export function HistoryChart({
  data,
  metric,
  timePeriod,
  unit,
  className = "",
  setMetric,
  setTimePeriod,
}: HistoryChartProps) {
  const filteredData = Array.isArray(data)
    ? data.filter((d) => d.timestamp && d.value != null && !isNaN(d.value))
    : [];

  const chartData = {
    labels: filteredData.map((d) => new Date(d.timestamp)),
    datasets: [
      {
        label: `${metric.replace("_", " ")}${unit ? ` (${unit})` : ""}`,
        data: filteredData.map((d) => d.value),
        borderColor: "#6366F1",
        backgroundColor: "rgba(99,102,241,0.1)",
        tension: 0.3,
        fill: true,
        pointRadius: 3,
      },
    ],
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: { display: true },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.y} ${unit ?? ""}`,
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit:
            timePeriod === "day"
              ? "hour"
              : timePeriod === "week"
              ? "day"
              : "week",
          tooltipFormat: "yyyy/MM/dd HH:mm",
        },
        title: { display: true, text: "Time" },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: unit ?? "" },
      },
    },
  };

  return (
    <div className={`flex h-full flex-col rounded-xl ${className}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as Metric)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
        >
          {METRIC_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-900"
        >
          {TIME_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="min-h-[260px] flex-1">
        {filteredData.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No data available for this metric.
            </p>
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
}
