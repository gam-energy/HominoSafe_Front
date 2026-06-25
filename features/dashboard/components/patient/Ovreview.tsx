"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SummarySection, SectionType } from "./SummarySection";
import { useSummary } from "../../api/patient/useGetSummary";
import { useUser } from "@/context/UserContext";
import { useRecommendation } from "../../api/patient/useGetRecommen";
import { RecommendSection } from "./RecommendSection";
import { Card } from "@/components/ui/card";
import { useGetOVerview } from "../../api/patient/useGetOverview";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

const AUTO_ROTATE_DELAY = 60000;

type TabType = "overview" | "recommendation" | "risk";

const mockRisk = {
  user_id: 4,
  last_updated: "2026-06-25T05:10:28.866975Z",
  kpis: {
    heart_rate: {
      value: 50.7,
      trend: "decreasing",
      average_last_24h: 69.8,
      average_last_7d: 75.6,
      unit: "bpm",
    },
    bp_systolic: {
      value: 111.3,
      trend: "stable",
      average_last_24h: 118.6,
      average_last_7d: 122.6,
      unit: "mmHg",
    },
    bp_diastolic: {
      value: 80.1,
      trend: "stable",
      average_last_24h: 79.3,
      average_last_7d: 79.0,
      unit: "mmHg",
    },
    spo2: {
      value: 94.9,
      trend: "stable",
      average_last_24h: 94.5,
      average_last_7d: 94.5,
      unit: "%",
    },
    temperature: {
      value: null,
      trend: "not_enough_data",
      average_last_24h: null,
      average_last_7d: null,
      unit: "°C",
    },
    body_temperature: {
      value: 37.0,
      trend: "stable",
      average_last_24h: 37.1,
      average_last_7d: 37.0,
      unit: "°C",
    },
    humidity: {
      value: null,
      trend: "not_enough_data",
      average_last_24h: null,
      average_last_7d: null,
      unit: "%",
    },
    mq2: {
      value: null,
      trend: "not_enough_data",
      average_last_24h: null,
      average_last_7d: null,
      unit: "µg/m³",
    },
    CO2: {
      value: null,
      trend: "not_enough_data",
      average_last_24h: null,
      average_last_7d: null,
      unit: "ppm",
    },
  },
  recent_alerts: [
    "Fall risk increased due to overnight hypotension (SBP 110). Recommendation: supervised ambulation.",
    "Heart rate elevated to 92 BPM following postural transition. Patient may be in brief distress.",
    "SpO2 dropped to 91% during sleep. Possible mild sleep apnea. Continue monitoring.",
  ],
  risk_assessments: [
    {
      time: "2026-06-25T07:12:00.000Z",
      risk_level: "medium",
      predicted_condition:
        "Predicted orthostatic hypotension | Composite physiologic risk score: 42.7/100",
      recommendation:
        "Clinical monitoring recommended during early-morning postural transitions. No immediate intervention required.",
    },
    {
      time: "2026-06-25T07:12:00.000Z",
      risk_level: "medium",
      predicted_condition:
        "Short-term blood pressure instability (30–45 min window) | Score: 39/100",
      recommendation:
        "Observe trends and recurrence patterns. Review timing and cumulative effects of rate-limiting therapy if episodes persist.",
    },
    {
      time: "2026-06-25T07:12:00.000Z",
      risk_level: "low",
      predicted_condition:
        "Fall risk secondary to hemodynamic instability | Score: 18/100",
      recommendation:
        "No escalation required. No fall, gait abnormality, or activity anomaly detected.",
    },
    {
      time: "2026-06-25T07:12:00.000Z",
      risk_level: "low",
      predicted_condition:
        "Acute cardiac or hypoxic event risk | Score: 12/100",
      recommendation:
        "No arrhythmic, ischemic, or hypoxic patterns identified. Routine monitoring only.",
    },
  ],
};

const mockRecommendation = {
  timestamp: "2026-06-25T07:12:45.000Z",
  user_id: 1,
  health_metrics: {
    heart_rate: {
      value: 58,
      status: "normal" as const,
      reference_range: "60-100",
      recommendation: "Regular resting rate.",
      priority: "low" as const
    },
    blood_pressure: {
      value: 118,
      status: "normal" as const,
      reference_range: "110-130",
      recommendation: "Stable pressure.",
      priority: "low" as const
    }
  },
  environment_metrics: {},
  general_recommendations: [
    "Take extra time when changing positions in the morning.",
    "Remain seated briefly before standing fully after waking.",
    "Continue routine monitoring of blood pressure trends.",
    "Observe for recurring morning patterns related to posture or timing of medications.",
  ],
  alert_level_value: "1" as const,
};

interface OvreviewProps {
  /**
   * Optional user id to load data for. When provided (e.g. a doctor
   * viewing a specific patient), data is fetched for that user instead
   * of the currently logged-in user.
   */
  userId?: number;
}

export default function Ovreview({ userId: userIdProp }: OvreviewProps = {}) {
  const { t } = useTranslation();
  const { user } = useUser();
  const userId = userIdProp ?? user?.id ?? 0;

  const { data: recommendationData } = useRecommendation(userId);
  const { data: summaryData } = useSummary(userId);
  const { data: overViewData } = useGetOVerview(userId);

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [summaryTab, setSummaryTab] = useState<SectionType>("kpis");

  const [isFading, setIsFading] = useState(false);
  const [pendingTab, setPendingTab] = useState<TabType | null>(null);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());

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

      if (pendingTab === "overview") setSummaryTab("kpis");
      else if (pendingTab === "recommendation") setSummaryTab("alerts");
      else if (pendingTab === "risk") setSummaryTab("risk");

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
      const timeSinceLastInteraction = now - lastInteractionTime;

      if (timeSinceLastInteraction < AUTO_ROTATE_DELAY) return;

      const nextIndex = (index + 1) % tabs.length;
      autoRotateTab(tabs[nextIndex]);
      index = nextIndex;
    }, 4500);

    return () => clearInterval(interval);
  }, [activeTab, lastInteractionTime]);

  const renderTabContent = () => {
    // We fall back to mock data if the API does not respond yet to ensure a beautiful experience
    const finalSummaryData = summaryData || mockRisk;
    
    if (activeTab === "overview" && finalSummaryData) {
      return (
        <SummarySection
          key="overview"
          data={finalSummaryData as any}
          liveData={overViewData}
          activeSection={summaryTab}
          onSectionChange={setSummaryTab}
        />
      );
    }

    if (activeTab === "recommendation") {
      const finalRecData = recommendationData || mockRecommendation;
      if (!finalRecData) return null;
      return (
        <RecommendSection
          key="recommendation"
          data={{
            ...finalRecData,
            alert_level_value:
              (finalRecData as any).alert_level_value ?? "0",
          }}
          activeSection={summaryTab}
          onSectionChange={setSummaryTab}
        />
      );
    }

    if (activeTab === "risk") {
      return (
        <SummarySection
          key="risk"
          data={mockRisk as any}
          activeSection={summaryTab}
          onSectionChange={setSummaryTab}
        />
      );
    }

    return null;
  };

  return (
    <Card className="flex h-full flex-col rounded-3xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm transition-all duration-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md">
      <Tabs
        value={activeTab}
        onValueChange={(val) => handleTabChange(val as TabType)}
        className="flex h-full w-full flex-col gap-5"
      >
        <TabsList className="grid w-full grid-cols-3 items-stretch rounded-full bg-muted/80 p-1 transition-all duration-300 h-11">
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
                className="rounded-full px-3 text-xs font-bold text-muted-foreground transition-all duration-300 sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm cursor-pointer whitespace-nowrap h-full flex items-center justify-center"
              >
                {label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <ScrollArea className="h-[420px] pr-4 mt-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="h-full w-full pb-6"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>
      </Tabs>
    </Card>
  );
}
