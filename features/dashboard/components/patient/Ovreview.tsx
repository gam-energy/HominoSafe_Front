"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SummarySection, SectionType } from "./SummarySection";
import { useSummary } from "../../api/patient/useGetSummary";
import { useUser } from "@/context/UserContext";
import { useRecommendation } from "../../api/patient/useGetRecommen";
import { RecommendSection } from "./RecommendSection";
import { Card } from "@/components/ui/card";
import { useGetOVerview } from "../../api/patient/useGetOverview";
import { useTranslation } from "react-i18next";

const AUTO_ROTATE_DELAY = 60000;

type TabType = "overview" | "recommendation" | "risk";

const mockRisk = {
  user_id: 4,
  last_updated: "2026-01-13T05:10:28.866975Z",
  kpis: {
    heart_rate: {
      value: 50.7,
      trend: "decreasing",
      average_last_24h: 69.86666666666669,
      average_last_7d: 75.68113617059578,
      unit: "bpm",
    },
    bp_systolic: {
      value: 111.3,
      trend: "stable",
      average_last_24h: 118.6729166666667,
      average_last_7d: 122.69951923076923,
      unit: "mmHg",
    },
    bp_diastolic: {
      value: 80.1,
      trend: "stable",
      average_last_24h: 79.37083333333332,
      average_last_7d: 79.09615384615375,
      unit: "mmHg",
    },
    spo2: {
      value: 94.9,
      trend: "stable",
      average_last_24h: 94.56249999999999,
      average_last_7d: 94.55128205128199,
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
      average_last_24h: 37.108333333333334,
      average_last_7d: 37.094871794871764,
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
    {
      id: 1,
      time: "2026-01-11T11:40:41.717730Z",
      alert_type: "Fall Risk / Hypotension",
      message:
        "Fall risk increased due to overnight hypotension (SBP 110). Recommendation: supervised ambulation.",
      severity: "High",
    },
    {
      id: 2,
      time: "2026-01-09T09:37:41.717688Z",
      alert_type: "Heart Rate Spike",
      message:
        "Heart rate elevated to 92 BPM following fall detection. Patient may be in distress.",
      severity: "High",
    },
    {
      id: 3,
      time: "2026-01-07T10:35:41.644575Z",
      alert_type: "SpO2 Warning",
      message:
        "SpO2 dropped to 91% during sleep. Possible respiratory distress. Continue monitoring.",
      severity: "Medium",
    },
  ],
  risk_assessments: [
    {
      time: "2026-01-20T07:12:00.000000Z",
      risk_level: "Moderate",
      predicted_condition:
        "Predicted orthostatic hypotension | Composite physiologic risk score: 42.7/100",
      recommendation:
        "Clinical monitoring recommended during early-morning postural transitions. No immediate intervention required.",
    },
    {
      time: "2026-01-20T07:12:00.000000Z",
      risk_level: "Moderate",
      predicted_condition:
        "Short-term blood pressure instability (30–45 min window) | Score: 39/100",
      recommendation:
        "Observe trends and recurrence patterns. Review timing and cumulative effects of rate-limiting therapy if episodes persist.",
    },
    {
      time: "2026-01-20T07:12:00.000000Z",
      risk_level: "Low",
      predicted_condition:
        "Fall risk secondary to hemodynamic instability | Score: 18/100",
      recommendation:
        "No escalation required. No fall, gait abnormality, or activity anomaly detected.",
    },
    {
      time: "2026-01-20T07:12:00.000000Z",
      risk_level: "Low",
      predicted_condition:
        "Acute cardiac or hypoxic event risk | Score: 12/100",
      recommendation:
        "No arrhythmic, ischemic, or hypoxic patterns identified. Routine monitoring only.",
    },
  ],
};

const mockRecommendation = {
  timestamp: "2026-01-20T07:12:45.000000Z",
  user_id: 1,
  health_metrics: {
    heart_rate: 58,
    blood_pressure: {
      systolic: 118,
      diastolic: 72,
    },
    spo2: 96,
  },
  environment_metrics: {
    location: "Bedroom",
    activity_context: "Morning postural transition",
  },
  general_recommendations: [
    "Take extra time when changing positions in the morning.",
    "Remain seated briefly before standing fully after waking.",
    "Continue routine monitoring of blood pressure trends.",
    "Observe for recurring morning patterns related to posture or timing of medications.",
  ],
  alert_level_value: 2,
};

export default function Ovreview() {
  const { t } = useTranslation();
  const { user } = useUser();
  const userId = user?.id ?? 0;

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
    }, 300);

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
    }, 3500);

    return () => clearInterval(interval);
  }, [activeTab, lastInteractionTime]);

  const renderTabContent = () => {
    if (activeTab === "overview" && summaryData) {
      return (
        <SummarySection
          key="overview"
          data={summaryData}
          liveData={overViewData}
          activeSection={summaryTab}
          onSectionChange={setSummaryTab}
        />
      );
    }

    if (activeTab === "recommendation") {
      if (!mockRecommendation) return null;
      return (
        <RecommendSection
          key="recommendation"
          data={{
            ...mockRecommendation,
            alert_level_value:
              (mockRecommendation as any).alert_level_value ?? "0",
          }}
          activeSection={summaryTab}
          onSectionChange={setSummaryTab}
        />
      );
    }

    if (activeTab === "risk" && mockRisk) {
      return (
        <SummarySection
          key="risk"
          data={mockRisk}
          activeSection={summaryTab}
          onSectionChange={setSummaryTab}
        />
      );
    }

    return null;
  };

  return (
    <Card className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md">
      <Tabs
        value={activeTab}
        onValueChange={(val) => handleTabChange(val as TabType)}
        className="flex h-full w-full flex-col gap-4"
      >
        <TabsList className="flex w-full gap-1 overflow-x-auto rounded-xl border-none bg-muted p-1 transition-colors duration-300 sm:grid sm:grid-cols-3 sm:overflow-visible">
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
                className="min-w-max rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-300 sm:text-base data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                {label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div
          className={`min-h-[320px] flex-1 overflow-y-auto pr-1 transition-opacity duration-300 ease-in-out ${
            isFading ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          {renderTabContent()}
        </div>
      </Tabs>
    </Card>
  );
}
