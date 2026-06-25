import React, { useEffect, useState } from "react";
import ProfileCard from "./ProfileCard";
import Ovreview from "./Ovreview";
import { OverviewSection } from "./OverviewSection";
import { useUser } from "@/context/UserContext";
import { useHistory } from "../../api/patient/useGetHistory";
import { HistoryChart, Metric, TimePeriod } from "./HistoryChart";
import { Card } from "@/components/ui/card";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Activity } from "lucide-react";

type OverviewData = {
  wearable: {
    timestamp: string;
    heart_rate: number;
    bp_systolic: number;
    bp_diastolic: number;
    spo2: number;
    activity: string;
    temperature: number;
  };
  environmental: {
    timestamp: string;
    temperature: number;
    humidity: number;
    MQ25: number;
    CO2: number;
  };
};

const heartRateList: number[] = [72, 74, 76, 78, 80, 82, 79, 77, 75, 73, 71, 70, 69, 68, 70, 72, 74, 76, 78, 80];
const bpSystolicList: number[] = [120, 122, 121, 119, 118, 117, 116, 115, 117, 119, 121, 123, 124, 122, 120, 118, 117, 119, 121, 120];
const bpDiastolicList: number[] = [80, 81, 79, 78, 77, 76, 75, 74, 76, 78, 80, 82, 83, 81, 80, 78, 77, 79, 80, 81];
const spo2List: number[] = [98, 97, 99, 98, 97, 96, 98, 99, 97, 98, 99, 98, 97, 96, 98, 99, 98, 97, 99, 98];
const temperatureList: number[] = [36.5, 36.6, 36.7, 36.8, 36.6, 36.5, 36.4, 36.3, 36.5, 36.6, 36.7, 36.8, 36.6, 36.5, 36.4, 36.3, 36.5, 36.6, 36.7, 36.8];
const envTemperatureList: number[] = [25, 26, 24, 23, 22, 21, 22, 23, 24, 25, 26, 27, 28, 27, 26, 25, 24, 23, 22, 21];
const humidityList: number[] = [50, 52, 54, 53, 51, 50, 49, 48, 50, 52, 54, 53, 51, 50, 49, 48, 50, 52, 54, 53];
const mq25List: number[] = [15, 16, 14, 13, 12, 13, 14, 15, 16, 15, 14, 13, 12, 13, 14, 15, 16, 15, 14, 13];
const co2List: number[] = [450, 455, 460, 458, 455, 452, 450, 448, 445, 450, 455, 460, 458, 455, 452, 450, 448, 445, 450, 455];

function generateMockOverviewData(index: number): OverviewData {
  const now = new Date().toISOString();
  return {
    wearable: {
      timestamp: now,
      heart_rate: heartRateList[index],
      bp_systolic: bpSystolicList[index],
      bp_diastolic: bpDiastolicList[index],
      spo2: spo2List[index],
      activity: "Sitting",
      temperature: temperatureList[index],
    },
    environmental: {
      timestamp: now,
      temperature: envTemperatureList[index],
      humidity: humidityList[index],
      MQ25: mq25List[index],
      CO2: co2List[index],
    },
  };
}

const Dashboard = () => {
  const { user } = useUser();
  const userId = user?.id ?? 0;
  const [metric, setMetric] = useState<Metric>("heart_rate");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("day");
  const metrics: Metric[] = [metric];

  const [metricIndex, setMetricIndex] = useState(0);
  const [mockOverviewData, setMockOverviewData] = useState<OverviewData>(generateMockOverviewData(0));

  useEffect(() => {
    const interval = setInterval(() => {
      const tehranDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tehran" }));
      if (tehranDate.getHours() === 17 && tehranDate.getMinutes() === 30) {
        setMetricIndex(0);
      } else {
        setMetricIndex((prev) => (prev + 1) % heartRateList.length);
      }
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setMockOverviewData(generateMockOverviewData(metricIndex));
  }, [metricIndex]);

  const { data: historyData, isLoading: isHistoryLoading } = useHistory(userId, metrics);

  const hasHistoryData =
    !!historyData &&
    !!historyData.data &&
    typeof historyData.data === "object" &&
    !Array.isArray(historyData.data) &&
    Array.isArray((historyData.data as Record<string, unknown[]>)[metric]) &&
    (historyData.data as Record<string, unknown[]>)[metric].length > 0;

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-col gap-6">
        <Heading
          title="Dashboard Overview"
          description={`Welcome back, ${user?.first_name || "User"}!`}
        />

        <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <ProfileCard />
          </div>
          <div className="xl:col-span-8">
            <Ovreview />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <OverviewSection data={mockOverviewData} />
          </div>

          <Card className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-zinc-700 dark:bg-zinc-800 xl:col-span-7">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight">Health History</h3>
              <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                Live Data
              </div>
            </div>
            <div className="min-h-[340px] flex-1">
              {isHistoryLoading ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <div className="flex animate-pulse flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-bounce rounded-full bg-blue-200 dark:bg-blue-800" />
                    <span>Loading history...</span>
                  </div>
                </div>
              ) : hasHistoryData ? (
                <HistoryChart
                  data={((historyData.data as unknown) as Record<string, { timestamp: string; value: number }[]>)[metric]}
                  metric={metric}
                  timePeriod={timePeriod}
                  unit={historyData.units?.[metric as keyof typeof historyData.units]}
                  className="h-full w-full"
                  setMetric={setMetric}
                  setTimePeriod={setTimePeriod}
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <div className="rounded-full bg-gray-50 p-4 dark:bg-zinc-900">
                    <Activity className="h-8 w-8 opacity-20" />
                  </div>
                  <p>No history data to display.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
