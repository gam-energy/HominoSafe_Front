import React, { useState } from "react";
import ProfileCard from "./ProfileCard";
import Ovreview from "./Ovreview";
import { OverviewSection } from "./OverviewSection";
import { useUser } from "@/context/UserContext";
import { useHistory } from "../../api/patient/useGetHistory";
import { useGetOVerview } from "../../api/patient/useGetOverview";
import { HistoryChart, Metric, TimePeriod } from "./HistoryChart";
import { Card } from "@/components/ui/card";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const userId = user?.id ?? 0;
  const [metric, setMetric] = useState<Metric>("heart_rate");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("day");
  const metrics: Metric[] = [metric];

  // Real latest vitals (wearable + environmental) from the backend.
  const { data: overviewData, isLoading: isOverviewLoading } = useGetOVerview(userId);

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
          title={t("dashboard_overview", "Dashboard Overview")}
          description={t("hi_welcome_back", { name: user?.first_name || "User" })}
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
            <OverviewSection data={overviewData} isLoading={isOverviewLoading} />
          </div>

          <Card className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md xl:col-span-7">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight">{t("health_history", "Health History")}</h3>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-success">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                {t("live_data", "Live Data")}
              </div>
            </div>
            <div className="min-h-[340px] flex-1">
              {isHistoryLoading ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <div className="flex animate-pulse flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-bounce rounded-full bg-primary/30" />
                    <span>{t("loading", "Loading...")}</span>
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
                  <div className="rounded-full bg-muted p-4">
                    <Activity className="h-8 w-8 opacity-20" />
                  </div>
                  <p>{t("no_data", "No history data to display.")}</p>
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
