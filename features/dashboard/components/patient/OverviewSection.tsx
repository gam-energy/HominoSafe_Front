// components/OverviewSection.tsx
import { KpiCard } from "./KpiCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Thermometer, HeartPulse, Activity, Droplets, Wind, Gauge, Cloud, Radiation } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export function OverviewSection({ data }: { data: any }) {
  const { t } = useTranslation();
  const { wearable, environmental } = data;

  return (
    <div className="flex h-full flex-col rounded-3xl border border-zinc-200/80 bg-white/70 p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md">
      <Tabs defaultValue="vitals" className="flex h-full w-full flex-col">
        <TabsList className="mx-auto flex w-full max-w-md justify-start rounded-full bg-muted p-1 transition-colors duration-300 gap-0">
          <TabsTrigger
            value="vitals"
            className="flex-1 rounded-full py-2.5 text-xs font-bold text-muted-foreground transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md cursor-pointer focus-visible:outline-none"
          >
            {t('vitals')}
          </TabsTrigger>
          <TabsTrigger
            value="environment"
            className="flex-1 rounded-full py-2.5 text-xs font-bold text-muted-foreground transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md cursor-pointer focus-visible:outline-none"
          >
            {t('environment')}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="vitals"
          className="grid grid-cols-2 gap-4 pt-6 lg:grid-cols-3 outline-none"
        >
          <KpiCard
            title={t('heart_rate')}
            value={wearable.heart_rate}
            unit="bpm"
            icon={HeartPulse}
            color="text-rose-500"
            glowColor="bg-rose-500/10"
          />
          <KpiCard
            title={t('blood_pressure')}
            value={`${Math.round(wearable.bp_systolic)}/${Math.round(
              wearable.bp_diastolic
            )}`}
            unit="mmHg"
            icon={Gauge}
            color="text-violet-500"
            glowColor="bg-violet-500/10"
          />
          <KpiCard
            title="SpO2"
            value={wearable.spo2}
            unit="%"
            icon={Droplets}
            color="text-blue-500"
            glowColor="bg-blue-500/10"
          />
          <KpiCard
            title={t('temperature')}
            value={wearable.temperature}
            unit="°C"
            icon={Thermometer}
            color="text-orange-500"
            glowColor="bg-orange-500/10"
          />
          <KpiCard
            title={t('activity')}
            value={wearable.activity}
            icon={Activity}
            color="text-emerald-500"
            glowColor="bg-emerald-500/10"
          />
        </TabsContent>

        <TabsContent
          value="environment"
          className="grid grid-cols-2 gap-4 pt-6 lg:grid-cols-2 outline-none"
        >
          <KpiCard
            title={t('temperature')}
            value={environmental.temperature}
            unit="°C"
            icon={Thermometer}
            color="text-orange-500"
            glowColor="bg-orange-500/10"
          />
          <KpiCard
            title={t('humidity', 'Humidity')}
            value={environmental.humidity}
            unit="%"
            icon={Wind}
            color="text-blue-400"
            glowColor="bg-blue-400/10"
          />
          <KpiCard
            title="MQ25"
            value={environmental.MQ25}
            unit="ppm"
            icon={Radiation}
            color="text-yellow-500"
            glowColor="bg-yellow-500/10"
          />
          <KpiCard
            title="CO2"
            value={environmental.CO2}
            unit="ppm"
            icon={Cloud}
            color="text-zinc-500"
            glowColor="bg-zinc-500/10"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
