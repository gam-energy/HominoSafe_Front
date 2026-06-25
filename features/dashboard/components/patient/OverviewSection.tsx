// components/OverviewSection.tsx
import { KpiCard } from "./KpiCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Thermometer, HeartPulse, Activity, Droplets, Wind, Gauge, Cloud, Radiation } from "lucide-react";
import { useTranslation } from "react-i18next";

export function OverviewSection({ data }: { data: any }) {
  const { t } = useTranslation();
  const { wearable, environmental } = data;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <Tabs defaultValue="vitals" className="flex h-full w-full flex-col">
        <TabsList className="mx-auto grid w-full max-w-xs grid-cols-2 rounded-full bg-muted p-1 transition-colors duration-300">
            <TabsTrigger
              value="vitals"
              className="rounded-full py-2 text-muted-foreground transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              {t('vitals')}
            </TabsTrigger>
            <TabsTrigger
              value="environment"
              className="rounded-full py-2 text-muted-foreground transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              {t('environment')}
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="vitals"
            className="grid grid-cols-2 gap-4 pt-5 lg:grid-cols-3"
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
            className="grid grid-cols-2 gap-4 pt-5 lg:grid-cols-4"
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
  );
};
