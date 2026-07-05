"use client";

import { FC, JSX } from "react";
import { useProfile } from "@/features/medical-profile/api/useGetMedicalProfile";
import {
  normalizeComorbidities,
} from "@/features/medical-profile/utils/profile";
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

  if (error) {
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

  if (!data) {
    return (
      <PageContainer scrollable>
        <div className="flex w-full flex-col gap-6">
          <Heading
            title={t("medical_profile")}
            description={t("ehr_overview")}
          />
          <Alert className="max-w-xl">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>{t("no_profile_title", "No medical profile yet")}</AlertTitle>
            <AlertDescription>
              {t(
                "no_profile_desc",
                "Your medical records have not been added yet. Contact your care team to set up your profile."
              )}
            </AlertDescription>
          </Alert>
        </div>
      </PageContainer>
    );
  }

  const comorbidityEntries = normalizeComorbidities(data.comorbidities);
  const medications = data.medications ?? [];
  const symptoms = data.symptoms ?? [];

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

        {data.timestamp && (
          <p className="text-sm text-muted-foreground">
            {t("last_updated", "Last updated")}:{" "}
            {new Date(data.timestamp).toLocaleString()}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SectionCard titleKey="demographics" titleDefault="Demographics">
            <p className="font-medium text-foreground">
              {data.demographics || t("no_demographics")}
            </p>
          </SectionCard>

          <SectionCard titleKey="comorbidities" titleDefault="Comorbidities">
            {comorbidityEntries.length === 0 ? (
              <p>{t("no_comorbidities")}</p>
            ) : (
              <ul className="list-disc list-inside space-y-1.5">
                {comorbidityEntries.map(([key, value]) => (
                  <li key={key} className="text-muted-foreground">
                    <strong className="text-blue-600 dark:text-blue-400 font-semibold">
                      {key.replace(/_/g, " ")}:
                    </strong>{" "}
                    <span className="text-foreground font-medium">
                      {value || t("no_data", "No data")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard titleKey="diagnosis" titleDefault="Diagnosis">
            <p className="text-foreground font-medium">
              {data.diagnosis || t("no_diagnosis", "No diagnosis recorded.")}
            </p>
          </SectionCard>

          <SectionCard titleKey="physician_notes" titleDefault="Physician Notes">
            <p className="text-foreground font-medium">
              {data.physician_notes || t("no_notes", "No notes available.")}
            </p>
          </SectionCard>

          <SectionCard titleKey="medicine" titleDefault="Medications">
            {medications.length === 0 ? (
              <p>{t("no_medications")}</p>
            ) : (
              <MedicationsList medications={medications} />
            )}
          </SectionCard>

          <SectionCard titleKey="symptoms" titleDefault="Symptoms">
            {symptoms.length === 0 ? (
              <p>{t("no_symptoms")}</p>
            ) : (
              <ul className="list-disc list-inside space-y-1.5">
                {symptoms.map((symptom) => (
                  <li key={symptom.id} className="text-foreground">
                    <strong className="text-blue-600 dark:text-blue-400 font-semibold">
                      {symptom.name}
                    </strong>{" "}
                    — {t("severity")}: {symptom.severity}
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
