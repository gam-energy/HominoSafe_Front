"use client";

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/features/medical-profile/api/useGetMedicalProfile";
import MedicationsCards from "./MedicationsCards";
import { AlertTriangle, Pill } from "lucide-react";
import { LoaderIcon } from "@/components/chat/icons";
import { useTranslation } from "react-i18next";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";

const mockData = {
  ehr_id: 1,
  demographics: "78-year-old Hispanic female, Lives alone, retired.",
  comorbidities: {
    "0": "Hypertension",
    "1": "Type 2 Diabetes Mellitus",
    "2": "Heart Failure with preserved Ejection Fraction (HFpEF)",
    "3": "Orthostatic Hypotension (intermittent)",
  },
  diagnosis:
    "Chronic cardiovascular and metabolic conditions with predicted orthostatic hypotension related to medication and autonomic impairment.",
  physician_notes:
    "Morning postural transition associated with predicted systolic blood pressure decline. Reduced baroreflex compensation likely due to beta-blocker therapy, diabetic autonomic dysfunction, and HFpEF preload sensitivity. No arrhythmic, ischemic, or hypoxic patterns detected. No escalation required.",
  timestamp: "2026-01-20T07:12:00.000000+00:00",
  medications: [
    {
      id: 1,
      name: "Beta-blocker",
      dosage: "Not specified",
      frequency: "Daily",
      start_date: "2025-01-01T00:00:00.000000+00:00",
      end_date: null,
      notes:
        "Rate-limiting therapy contributing to attenuated chronotropic response.",
    },
    {
      id: 2,
      name: "ACE Inhibitor",
      dosage: "Not specified",
      frequency: "Daily",
      start_date: "2025-01-01T00:00:00.000000+00:00",
      end_date: null,
      notes: "Prescribed for long-standing hypertension management.",
    },
    {
      id: 3,
      name: "Metformin",
      dosage: "Not specified",
      frequency: "BID",
      start_date: "2025-01-01T00:00:00.000000+00:00",
      end_date: null,
      notes: "Prescribed for type 2 diabetes mellitus.",
    },
  ],
  symptoms: [],
};

const Medicine = () => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useProfile();

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="animate-spin text-blue-600 dark:text-blue-500">
            <LoaderIcon size={40} />
          </div>
          <p className="text-muted-foreground font-medium text-lg">
            {t("loading_medicine")}
          </p>
        </div>
      </PageContainer>
    );
  }

  if (error || !mockData) {
    return (
      <PageContainer>
        <div className="flex justify-center py-20">
          <Alert variant="destructive" className="max-w-xl shadow-lg rounded-2xl">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>{t("error")}</AlertTitle>
            <AlertDescription>
              {t("error_loading_profile")}
            </AlertDescription>
          </Alert>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-col gap-6">
        <Heading
          title={t("medicine_management")}
          description={t("manage_medications")}
        />

        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2.5 pb-3">
            <Pill className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-lg font-bold text-foreground">
              {t("medicine")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {mockData.medications.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("no_medications")}</p>
            ) : (
              <MedicationsCards medications={mockData.medications} />
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Medicine;
