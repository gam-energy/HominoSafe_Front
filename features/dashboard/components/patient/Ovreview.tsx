"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummarySection } from "./SummarySection";
import { useSummary } from "../../api/patient/useGetSummary";
import { useUser } from "@/context/UserContext";
import { useRecommendation } from "../../api/patient/useGetRecommen";
import { RecommendSection } from "./RecommendSection";
import { Card } from "@/components/ui/card";
import { useGetOVerview } from "../../api/patient/useGetOverview";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useLatestPatientState } from '@/features/predictions/api/useLatestPatientState';
import { useRiskAssessment } from '@/features/predictions/api/useRiskAssessment';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  enrichSummary,
  hasOverviewContent,
} from '@/features/dashboard/utils/enrichSummary';
import { KpiExportMenu } from './KpiExportMenu';

const AUTO_ROTATE_DELAY = 60000;

type TabType = "overview" | "recommendation" | "risk";

interface OvreviewProps {
  userId?: number;
  patientName?: string;
}

export default function Ovreview({ userId: userIdProp, patientName: patientNameProp }: OvreviewProps = {}) {
  const { t } = useTranslation();
  const { user } = useUser();
  const userId = userIdProp ?? user?.id ?? 0;

  const {
    data: summaryData,
    refetch: refetchSummary,
    isLoading: summaryLoading,
  } = useSummary(userId);
  const { data: recommendationData, isLoading: recLoading } =
    useRecommendation(userId);
  const { data: overViewData, isLoading: overviewLoading } =
    useGetOVerview(userId);
  const { data: patientState } = useLatestPatientState(userId);
  const riskMutation = useRiskAssessment();

  const enrichedSummary = useMemo(
    () => enrichSummary(summaryData, overViewData, userId),
    [summaryData, overViewData, userId]
  );

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isFading, setIsFading] = useState(false);
  const [pendingTab, setPendingTab] = useState<TabType | null>(null);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());

  const patientName =
    patientNameProp ??
    (user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : undefined);

  const exportSummary = useMemo(() => {
    const assessments = [...(enrichedSummary.risk_assessments ?? [])];
    if (patientState && assessments.length === 0) {
      assessments.push({
        time: patientState.timestamp ?? new Date().toISOString(),
        risk_level: patientState.risk_level ?? 'unknown',
        predicted_condition: t('latest_patient_state', 'Latest patient state computed'),
        recommendation: t('continue_monitoring', 'Continue monitoring wearable data.'),
      });
    }
    return { ...enrichedSummary, risk_assessments: assessments };
  }, [enrichedSummary, patientState, t]);

  const canExport = hasOverviewContent(enrichedSummary, overViewData);
  const isLoading = summaryLoading || overviewLoading;

  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return;
    setLastInteractionTime(Date.now());
    setIsFading(true);
    setPendingTab(tab);
  };

  const autoRotateTab = (tab: TabType) => {
    if (tab === activeTab) return;
    setIsFading(true);
    setPendingTab(tab);
  };

  useEffect(() => {
    if (!isFading || pendingTab === null) return;
    const timer = setTimeout(() => {
      setActiveTab(pendingTab);
      setIsFading(false);
      setPendingTab(null);
    }, 200);
    return () => clearTimeout(timer);
  }, [isFading, pendingTab]);

  useEffect(() => {
    const tabs: TabType[] = ["overview", "recommendation", "risk"];
    let index = tabs.indexOf(activeTab);
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastInteractionTime < AUTO_ROTATE_DELAY) return;
      const nextIndex = (index + 1) % tabs.length;
      autoRotateTab(tabs[nextIndex]);
      index = nextIndex;
    }, 4500);
    return () => clearInterval(interval);
  }, [activeTab, lastInteractionTime]);

  const handleRunRiskAssessment = async () => {
    try {
      await riskMutation.mutateAsync({ userId, body: { force_refresh: true } });
      await refetchSummary();
      toast.success(t('risk_assessment_complete', 'Risk assessment updated'));
    } catch {
      toast.error(t('risk_assessment_failed', 'Risk assessment failed'));
    }
  };

  const renderTabContent = () => {
    if (isLoading && activeTab === "overview") {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">{t("loading_overview", "Loading daily overview...")}</p>
        </div>
      );
    }

    if (activeTab === "overview") {
      if (!canExport) {
        return (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center px-4">
            <p className="text-sm text-muted-foreground max-w-sm">
              {t(
                "overview_empty_hint",
                "No health data yet. Connect your smart watch from the profile card to populate your daily overview with live vitals."
              )}
            </p>
          </div>
        );
      }

      return (
        <SummarySection
          key="overview"
          data={enrichedSummary}
          liveData={overViewData}
          activeSection="kpis"
          layout="full"
        />
      );
    }

    if (activeTab === "recommendation") {
      if (recLoading) {
        return (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        );
      }
      if (!recommendationData) {
        return (
          <p className="text-sm text-muted-foreground italic py-8 text-center">
            {t("no_recommendations", "No recommendations available yet.")}
          </p>
        );
      }
      return (
        <RecommendSection
          key="recommendation"
          data={{
            ...recommendationData,
            alert_level_value: (
              (recommendationData as { alert_level_value?: string }).alert_level_value ?? "0"
            ) as "0" | "1" | "2",
          }}
          activeSection="alerts"
        />
      );
    }

    if (activeTab === "risk") {
      if (!exportSummary.risk_assessments?.length) {
        return (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {t(
                'no_risk_data',
                'No risk assessment data yet. Run an assessment after sufficient wearable data is collected.'
              )}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRunRiskAssessment}
              disabled={riskMutation.isPending}
            >
              <RefreshCw
                className={`h-4 w-4 me-2 ${riskMutation.isPending ? 'animate-spin' : ''}`}
              />
              {t('run_risk_assessment', 'Run Risk Assessment')}
            </Button>
          </div>
        );
      }
      return (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRunRiskAssessment}
              disabled={riskMutation.isPending}
            >
              <RefreshCw
                className={`h-4 w-4 me-1 ${riskMutation.isPending ? 'animate-spin' : ''}`}
              />
              {t('refresh', 'Refresh')}
            </Button>
          </div>
          <SummarySection
            key="risk"
            data={exportSummary}
            activeSection="risk"
          />
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="flex h-full min-h-0 flex-col rounded-3xl border border-zinc-200/80 bg-white/70 p-4 shadow-sm transition-all duration-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md sm:p-5">
      <div className="mb-1 flex shrink-0 items-center justify-end">
        <KpiExportMenu
          summary={exportSummary}
          recommendations={
            recommendationData
              ? {
                  ...recommendationData,
                  alert_level_value: (
                    (recommendationData as { alert_level_value?: string }).alert_level_value ?? "0"
                  ) as "0" | "1" | "2",
                }
              : null
          }
          patientId={userId}
          patientName={patientName || undefined}
          activity={overViewData?.wearable?.activity}
          disabled={!canExport || isLoading}
        />
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(val) => handleTabChange(val as TabType)}
        className="flex min-h-0 w-full flex-1 flex-col gap-3"
      >
        <TabsList className="grid h-auto min-h-10 w-full shrink-0 grid-cols-3 items-stretch rounded-full bg-muted/80 p-1 transition-all duration-300 sm:h-11">
          {(["overview", "recommendation", "risk"] as TabType[]).map((tab) => {
            const label =
              tab === "overview"
                ? t("daily_overview", "Daily Overview")
                : tab === "recommendation"
                  ? t("recommendation", "Recommendation")
                  : t("risk", "Risk");
            return (
              <TabsTrigger
                key={tab}
                value={tab}
                className="flex h-full cursor-pointer items-center justify-center rounded-full px-1 py-2 text-[10px] font-bold leading-tight text-muted-foreground transition-all duration-300 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:px-3 sm:text-sm sm:leading-normal"
              >
                {label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Scrollable body: reserved gutter so the scrollbar never sits on content */}
        <div className="flex min-h-0 flex-1">
          <div
            className={
              "overview-panel-scroll min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-scroll pe-3 " +
              "[scrollbar-gutter:stable] [scrollbar-width:thin] " +
              "[&::-webkit-scrollbar]:w-2.5 " +
              "[&::-webkit-scrollbar-track]:bg-transparent " +
              "[&::-webkit-scrollbar-thumb]:rounded-full " +
              "[&::-webkit-scrollbar-thumb]:bg-zinc-300/80 " +
              "dark:[&::-webkit-scrollbar-thumb]:bg-zinc-600/80"
            }
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="w-full max-w-full pe-1 pb-1"
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Tabs>
    </Card>
  );
}
