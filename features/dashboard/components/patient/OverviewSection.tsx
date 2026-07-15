// components/OverviewSection.tsx
'use client';

import { KpiCard } from './KpiCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Thermometer,
  HeartPulse,
  Activity,
  Droplets,
  Wind,
  Gauge,
  Cloud,
  Radiation,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDashboardPrefs } from '@/features/settings/hooks/useDashboardPrefs';
import { cn } from '@/lib/utils';

type WearableView = {
  heart_rate?: number | null;
  bp_systolic?: number | null;
  bp_diastolic?: number | null;
  spo2?: number | null;
  temperature?: number | null;
  activity?: string | null;
};

type EnvironmentalView = {
  temperature?: number | null;
  humidity?: number | null;
  MQ25?: number | null;
  mq2?: number | null;
  CO2?: number | null;
};

type OverviewView = {
  wearable?: WearableView | null;
  environmental?: EnvironmentalView | null;
};

function displayValue(
  value: number | string | null | undefined,
  fallback = '—',
  decimals?: number
) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'number' && decimals != null) {
    return Number.isFinite(value) ? value.toFixed(decimals) : fallback;
  }
  return value;
}

function displayBp(systolic?: number | null, diastolic?: number | null) {
  if (systolic == null || diastolic == null) return '—';
  return `${Math.round(systolic)}/${Math.round(diastolic)}`;
}

export function OverviewSection({
  data,
  isLoading = false,
}: {
  data?: OverviewView | null;
  isLoading?: boolean;
}) {
  const { t } = useTranslation();
  const { prefs } = useDashboardPrefs();
  const showAll = prefs.showAllCharts;
  const compact = prefs.compactCharts;

  const wearable = data?.wearable ?? {};
  const environmental = data?.environmental ?? {};
  const gas = environmental.MQ25 ?? environmental.mq2;

  if (isLoading && !data) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded-3xl border border-zinc-200/80 bg-white/70 p-4 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md sm:min-h-[280px] sm:p-6">
        <span className="text-sm text-muted-foreground">
          {t('loading', 'Loading...')}
        </span>
      </div>
    );
  }

  if (!data?.wearable && !data?.environmental) {
    return (
      <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 rounded-3xl border border-zinc-200/80 bg-white/70 p-4 text-center shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md sm:min-h-[280px] sm:p-6">
        <Activity className="h-8 w-8 opacity-20" />
        <p className="text-sm text-muted-foreground">
          {t('no_sensor_data', 'No recent sensor data yet.')}
        </p>
      </div>
    );
  }

  const vitalCards = (
    <>
      <KpiCard
        compact={compact}
        title={t('heart_rate')}
        value={displayValue(wearable.heart_rate)}
        unit="bpm"
        icon={HeartPulse}
        color="text-rose-500"
        glowColor="bg-rose-500/10"
      />
      <KpiCard
        compact={compact}
        title={t('blood_pressure')}
        value={displayBp(wearable.bp_systolic, wearable.bp_diastolic)}
        unit="mmHg"
        icon={Gauge}
        color="text-violet-500"
        glowColor="bg-violet-500/10"
      />
      <KpiCard
        compact={compact}
        title="SpO2"
        value={displayValue(wearable.spo2)}
        unit="%"
        icon={Droplets}
        color="text-blue-500"
        glowColor="bg-blue-500/10"
      />
      <KpiCard
        compact={compact}
        title={t('temperature')}
        value={displayValue(wearable.temperature)}
        unit="°C"
        icon={Thermometer}
        color="text-orange-500"
        glowColor="bg-orange-500/10"
      />
      <KpiCard
        compact={compact}
        title={t('activity')}
        value={displayValue(wearable.activity)}
        icon={Activity}
        color="text-emerald-500"
        glowColor="bg-emerald-500/10"
      />
    </>
  );

  const envCards = (
    <>
      <KpiCard
        compact={compact}
        title={t('env_temperature', 'Env. Temperature')}
        value={displayValue(environmental.temperature, '—', 2)}
        unit="°C"
        icon={Thermometer}
        color="text-orange-500"
        glowColor="bg-orange-500/10"
      />
      <KpiCard
        compact={compact}
        title={t('humidity', 'Humidity')}
        value={displayValue(environmental.humidity, '—', 2)}
        unit="%"
        icon={Wind}
        color="text-blue-400"
        glowColor="bg-blue-400/10"
      />
      <KpiCard
        compact={compact}
        title="MQ2"
        value={displayValue(gas, '—', 2)}
        unit="ppm"
        icon={Radiation}
        color="text-yellow-500"
        glowColor="bg-yellow-500/10"
      />
      <KpiCard
        compact={compact}
        title="CO2"
        value={displayValue(environmental.CO2, '—', 2)}
        unit="ppm"
        icon={Cloud}
        color="text-zinc-500"
        glowColor="bg-zinc-500/10"
      />
    </>
  );

  const gridClass = cn(
    'grid gap-3 pt-4 outline-none sm:gap-4 sm:pt-6',
    compact
      ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  );

  return (
    <div className="flex h-full flex-col rounded-3xl border border-zinc-200/80 bg-white/70 p-4 shadow-sm transition-all duration-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md sm:p-6">
      {showAll ? (
        <div className="flex flex-col gap-5">
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('vitals')}
            </h4>
            <div className={gridClass}>{vitalCards}</div>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('environment')}
            </h4>
            <div className={gridClass}>{envCards}</div>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="vitals" className="flex h-full w-full flex-col">
          <TabsList className="mx-auto flex w-full max-w-md justify-start gap-0 rounded-full bg-muted p-1 transition-colors duration-300">
            <TabsTrigger
              value="vitals"
              className="flex-1 cursor-pointer rounded-full py-2 text-xs font-bold text-muted-foreground transition-all duration-300 focus-visible:outline-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md sm:py-2.5"
            >
              {t('vitals')}
            </TabsTrigger>
            <TabsTrigger
              value="environment"
              className="flex-1 cursor-pointer rounded-full py-2 text-xs font-bold text-muted-foreground transition-all duration-300 focus-visible:outline-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md sm:py-2.5"
            >
              {t('environment')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vitals" className={gridClass}>
            {vitalCards}
          </TabsContent>

          <TabsContent value="environment" className={gridClass}>
            {envCards}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
