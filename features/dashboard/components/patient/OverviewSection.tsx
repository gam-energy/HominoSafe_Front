// components/OverviewSection.tsx
import { KpiCard } from "./KpiCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Thermometer, HeartPulse, Activity, Droplets, Wind, Gauge, Cloud, Radiation } from "lucide-react";
import { useTranslation } from "react-i18next";

export function OverviewSection({ data }: { data: any }) {
  const { t } = useTranslation();
  const { wearable, environmental } = data;

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-gray-100 dark:border-zinc-700 p-6 transition-all duration-300 hover:shadow-xl">
      <div className="w-full h-full flex flex-col gap-6">
        <Tabs defaultValue="vitals" className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-xs mx-auto bg-gray-100 dark:bg-zinc-700/50 p-1 rounded-full transition-colors duration-300">
            <TabsTrigger
              value="vitals"
              className="rounded-full py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-500 dark:data-[state=active]:text-white transition-all duration-300"
            >
              {t('vitals')}
            </TabsTrigger>
            <TabsTrigger
              value="environment"
              className="rounded-full py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-500 dark:data-[state=active]:text-white transition-all duration-300"
            >
              {t('environment')}
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="vitals"
            className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <KpiCard
              title={t('heart_rate')}
              value={wearable.heart_rate}
              unit="bpm"
              icon={HeartPulse}
              color="text-red-500"
            />
            <KpiCard
              title={t('blood_pressure')}
              value={`${Math.round(wearable.bp_systolic)}/${Math.round(
                wearable.bp_diastolic
              )}`}
              unit="mmHg"
              icon={Gauge}
              color="text-purple-500"
            />
            <KpiCard
              title="SpO2"
              value={wearable.spo2}
              unit="%"
              icon={Droplets}
              color="text-blue-500"
            />
            <KpiCard
              title={t('temperature')}
              value={wearable.temperature}
              unit="°C"
              icon={Thermometer}
              color="text-orange-500"
            />
            <KpiCard
              title={t('activity')}
              value={wearable.activity}
              icon={Activity}
              color="text-green-500"
            />
          </TabsContent>

          <TabsContent
            value="environment"
            className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <KpiCard
              title={t('temperature')}
              value={environmental.temperature}
              unit="°C"
              icon={Thermometer}
              color="text-orange-500"
            />
            <KpiCard
              title={t('humidity', 'Humidity')}
              value={environmental.humidity}
              unit="%"
              icon={Wind}
              color="text-blue-400"
            />
            <KpiCard
              title="MQ25"
              value={environmental.MQ25}
              unit="ppm"
              icon={Radiation}
              color="text-yellow-500"
            />
            <KpiCard
              title="CO2"
              value={environmental.CO2}
              unit="ppm"
              icon={Cloud}
              color="text-gray-500"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
