"use client";

import { FC, JSX } from "react";
import { useProfile } from "@/features/medical-profile/api/useGetMedicalProfile";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import {
  AlertTriangle,
  User,
  HeartPulse,
  Stethoscope,
  FileText,
  Pill,
  Activity,
} from "lucide-react";
import { LoaderIcon } from "@/components/chat/icons";
import { MedicationsList } from "./MedicationsList";

const iconMap: Record<string, JSX.Element> = {
  Demographics: <User className="h-5 w-5 text-blue-600 dark:text-blue-400 me-2" />,
  Comorbidities: <HeartPulse className="h-5 w-5 text-blue-600 dark:text-blue-400 me-2" />,
  Diagnosis: <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400 me-2" />,
  "Physician Notes": <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 me-2" />,
  Medications: <Pill className="h-5 w-5 text-blue-600 dark:text-blue-400 me-2" />,
  Symptoms: <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400 me-2" />,
};

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

const ProfileSection: FC = () => {
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
            {t("loading_profile")}
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

  const SectionCard = ({
    titleKey,
    titleDefault,
    children,
  }: {
    titleKey: string;
    titleDefault: string;
    children: React.ReactNode;
  }) => (
    <Card className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center">
          {iconMap[titleDefault]}
          <CardTitle className="text-lg font-bold text-foreground">
            {t(titleKey, titleDefault)}
          </CardTitle>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4 text-muted-foreground leading-relaxed space-y-2 text-sm">
        {children}
      </CardContent>
    </Card>
  );

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-col gap-6">
        <Heading
          title={t("medical_profile")}
          description={t("ehr_overview")}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* DEMOGRAPHICS */}
          <SectionCard titleKey="demographics" titleDefault="Demographics">
            <p className="font-medium text-foreground">{mockData.demographics || t("no_demographics")}</p>
          </SectionCard>

          {/* COMORBIDITIES */}
          <SectionCard titleKey="comorbidities" titleDefault="Comorbidities">
            {Object.entries(mockData.comorbidities).length === 0 ? (
              <p>{t("no_comorbidities")}</p>
            ) : (
              <ul className="list-disc list-inside space-y-1.5">
                {Object.entries(mockData.comorbidities).map(([key, value]) => {
                  const isEmpty =
                    typeof value === "object" &&
                    Object.keys(value).length === 0;

                  return (
                    <li key={key} className="text-muted-foreground">
                      <strong className="text-blue-600 dark:text-blue-400 font-semibold">
                        {key.replace(/_/g, " ")}:
                      </strong>{" "}
                      <span className="text-foreground font-medium">
                        {isEmpty ? "No Data" : String(value)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          {/* DIAGNOSIS */}
          <SectionCard titleKey="diagnosis" titleDefault="Diagnosis">
            <p className="text-foreground font-medium">{mockData.diagnosis}</p>
          </SectionCard>

          {/* PHYSICIAN NOTES */}
          <SectionCard titleKey="physician_notes" titleDefault="Physician Notes">
            <p className="text-foreground font-medium">{mockData.physician_notes}</p>
          </SectionCard>

          {/* MEDICATIONS */}
          <SectionCard titleKey="medicine" titleDefault="Medications">
            {mockData.medications.length === 0 ? (
              <p>{t("no_medications")}</p>
            ) : (
              <MedicationsList medications={mockData.medications} />
            )}
          </SectionCard>

          {/* SYMPTOMS */}
          <SectionCard titleKey="symptoms" titleDefault="Symptoms">
            {mockData.symptoms.length === 0 ? (
              <p>{t("no_symptoms")}</p>
            ) : (
              <ul className="list-disc list-inside space-y-1.5">
                {mockData.symptoms.map((symptom: any) => (
                  <li key={symptom.id} className="text-foreground">
                    <strong className="text-blue-600 dark:text-blue-400 font-semibold">{symptom.name}</strong> —
                    {t("severity")}: {symptom.severity}
                    {symptom.notes && (
                      <span className="italic text-muted-foreground">
                        {" "}
                        ({symptom.notes})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </PageContainer>
  );
};

export default ProfileSection;
