import React, { useMemo, useState } from 'react';
import ProfileCard from './ProfileCard';
import Ovreview from './Ovreview';
import { OverviewSection } from './OverviewSection';
import { useUser } from '@/context/UserContext';
import { useHistory } from '../../api/patient/useGetHistory';
import { useGetOVerview } from '../../api/patient/useGetOverview';
import { SubscriptionBanner } from '@/features/orders/components/SubscriptionBanner';
import {
  ALL_HISTORY_METRICS,
  HistoryChart,
  HistoryPeriodSelect,
  Metric,
  TimePeriod,
} from './HistoryChart';
import { Card } from '@/components/ui/card';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDashboardPrefs } from '@/features/settings/hooks/useDashboardPrefs';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const userId = user?.id ?? 0;
  const { prefs } = useDashboardPrefs();
  const [metric, setMetric] = useState<Metric>('heart_rate');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('day');

  const metrics = useMemo<Metric[]>(
    () => (prefs.showAllHistoryCharts ? ALL_HISTORY_METRICS : [metric]),
    [prefs.showAllHistoryCharts, metric]
  );

  const { data: overviewData, isLoading: isOverviewLoading } =
    useGetOVerview(userId);

  const { data: historyData, isLoading: isHistoryLoading } = useHistory(
    userId,
    metrics,
    timePeriod
  );

  const historyByMetric = (historyData?.data ?? {}) as Record<
    string,
    { timestamp: string; value: number }[]
  >;

  const hasAnyHistory = metrics.some(
    (m) => Array.isArray(historyByMetric[m]) && historyByMetric[m].length > 0
  );

  return (
    <PageContainer scrollable>
      <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
        <Heading
          title={t('dashboard_overview', 'Dashboard Overview')}
          description={t('hi_welcome_back', {
            name: user?.first_name || 'User',
          })}
        />

        <SubscriptionBanner />

        <div className="grid grid-cols-1 items-stretch gap-4 sm:gap-6 xl:grid-cols-12">
          {/* Profile card shows full content and defines the row height.
              On xl the overview is absolutely positioned inside its cell, so it
              gets the exact row height (= profile card height) and scrolls
              internally. On mobile both stack naturally. */}
          <div className="min-w-0 xl:col-span-4">
            <ProfileCard />
          </div>
          <div className="min-h-[420px] min-w-0 xl:col-span-8 xl:relative xl:min-h-0">
            <div className="h-full min-h-[420px] xl:absolute xl:inset-0 xl:min-h-0">
              <Ovreview />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-12">
          <div className="min-w-0 xl:col-span-5">
            <OverviewSection
              data={overviewData}
              isLoading={isOverviewLoading}
            />
          </div>

          <Card className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:shadow-md sm:p-6 xl:col-span-7">
            <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-bold tracking-tight sm:text-lg">
                {t('health_history', 'Health History')}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {prefs.showAllHistoryCharts && (
                  <HistoryPeriodSelect
                    timePeriod={timePeriod}
                    setTimePeriod={setTimePeriod}
                  />
                )}
                <div className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-success sm:text-xs">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                  {t('live_data', 'Live Data')}
                </div>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              {isHistoryLoading ? (
                <div className="flex min-h-[180px] w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <div className="flex animate-pulse flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-bounce rounded-full bg-primary/30" />
                    <span>{t('loading', 'Loading...')}</span>
                  </div>
                </div>
              ) : prefs.showAllHistoryCharts ? (
                hasAnyHistory ? (
                  <div className="flex flex-col gap-4">
                    {metrics.map((m) => {
                      const series = historyByMetric[m] ?? [];
                      if (!series.length) return null;
                      return (
                        <div
                          key={m}
                          className="rounded-xl border border-border/60 bg-muted/20 p-3"
                        >
                          <HistoryChart
                            data={series}
                            metric={m}
                            timePeriod={timePeriod}
                            unit={
                              historyData?.units?.[
                                m as keyof typeof historyData.units
                              ]
                            }
                            className="h-full w-full"
                            setTimePeriod={setTimePeriod}
                            hideMetricSelect
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyHistory t={t} />
                )
              ) : hasAnyHistory && historyByMetric[metric]?.length ? (
                <HistoryChart
                  data={historyByMetric[metric]}
                  metric={metric}
                  timePeriod={timePeriod}
                  unit={
                    historyData?.units?.[
                      metric as keyof typeof historyData.units
                    ]
                  }
                  className="h-full w-full"
                  setMetric={setMetric}
                  setTimePeriod={setTimePeriod}
                />
              ) : (
                <EmptyHistory t={t} />
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

function EmptyHistory({
  t,
}: {
  t: (key: string, defaultValue?: string) => string;
}) {
  return (
    <div className="flex min-h-[180px] w-full flex-col items-center justify-center gap-2 text-muted-foreground sm:min-h-[260px]">
      <div className="rounded-full bg-muted p-4">
        <Activity className="h-8 w-8 opacity-20" />
      </div>
      <p>{t('no_data', 'No history data to display.')}</p>
    </div>
  );
}

export default Dashboard;
