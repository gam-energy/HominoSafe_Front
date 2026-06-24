import React, { useEffect, useState } from "react";
import ProfileCard from "./ProfileCard";
import Ovreview from "./Ovreview";
import { OverviewSection } from "./OverviewSection";
import { useUser } from "@/context/UserContext";
import { useHistory } from "../../api/patient/useGetHistory";
import { HistoryChart } from "./HistoryChart";
import { Card } from "@/components/ui/card";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Activity } from "lucide-react";

type Metric = "heart_rate" | "spo2" | "blood_pressure";

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
  const metrics: Metric[] = ["heart_rate"];
  const metric = metrics[0];

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
    Array.isArray((historyData.data as Record<string, any[]>)[metric]) &&
    (historyData.data as Record<string, any[]>)[metric].length > 0;

  return (
    <PageContainer scrollable>
      <div className="flex flex-col gap-6 p-1">
        <div className="flex items-center justify-between">
          <Heading title="Dashboard Overview" description={`Welcome back, ${user?.first_name || 'User'}!`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 h-full">
            <ProfileCard />
          </div>
          <div className="lg:col-span-2 h-full">
            <Ovreview />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <OverviewSection data={mockOverviewData} />
          
          <Card className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-gray-100 dark:border-zinc-700 p-6 flex flex-col transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold tracking-tight">Heart Rate History</h3>
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Live Data
              </div>
            </div>
            <div className="flex-1 min-h-[300px]">
              {isHistoryLoading ? (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <div className="animate-pulse flex flex-col items-center gap-2">
                    <div className="h-8 w-8 bg-blue-200 dark:bg-blue-800 rounded-full animate-bounce" />
                    <span>Loading history...</span>
                  </div>
                </div>
              ) : hasHistoryData ? (
                <HistoryChart
                  data={((historyData.data as unknown) as Record<string, any[]>)[metric]}
                  metric={metric}
                  unit={historyData.units?.[metric as keyof typeof historyData.units]}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <div className="p-4 rounded-full bg-gray-50 dark:bg-zinc-900">
                    <Activity className="w-8 h-8 opacity-20" />
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
