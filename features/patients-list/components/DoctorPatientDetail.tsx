"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Activity, ArrowLeft, Brain, FileHeart, FileUp, Gauge, MessageCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { LoaderIcon } from "@/components/chat/icons";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";

import ProfileCard from "@/features/dashboard/components/patient/ProfileCard";
import Ovreview from "@/features/dashboard/components/patient/Ovreview";
import { OverviewSection } from "@/features/dashboard/components/patient/OverviewSection";
import { HistoryChart, Metric, TimePeriod } from "@/features/dashboard/components/patient/HistoryChart";
import { EditThresholdsModal } from "@/features/patients-list/components/user/EditThresholdsModal";
import { useUserProfiles } from "@/features/patients-list/api/useUserProfiles";
import { useGetPatientProfile } from "@/features/patients-list/api/use-get-patient-profile";
import { useGetOVerview } from "@/features/dashboard/api/patient/useGetOverview";
import { useHistory } from "@/features/dashboard/api/patient/useGetHistory";
import { useCreateRoom } from "@/features/chat/api/use-craete-room";
import { staffPatientRoutes } from "@/features/patient-knowledge/utils/staffRoutes";
import { StaffPatientNav } from "@/features/patients-list/components/StaffPatientNav";
import { useUser } from "@/context/UserContext";

type OverviewData = {
  wearable: {
    timestamp: string;
    heart_rate: number;
    bp_systolic: number;
    bp_diastolic: number;
    spo2: number;
    activity: string;
    temperature: number;
  };
  environmental: {
    timestamp: string;
    temperature: number;
    humidity: number;
    MQ25: number;
    CO2: number;
  };
};

const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Card className="border-muted-foreground/20 shadow-sm">
    <CardHeader>
      <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      <Separator className="mt-2" />
    </CardHeader>
    <CardContent className="pt-2 text-sm leading-relaxed space-y-2">
      {children}
    </CardContent>
  </Card>
);

export default function DoctorPatientDetail() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const userId = Number(
    Array.isArray(params.id) ? params.id[0] : params.id
  );
  const { user: currentUser } = useUser();
  const createRoomMutation = useCreateRoom();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const patientsListRoute =
    currentUser?.role === "caregiver"
      ? "/dashboard/my-patients"
      : "/dashboard/patients";
  const isDoctor = currentUser?.role === "doctor";
  const isCaregiver = currentUser?.role === "caregiver";
  const routes = staffPatientRoutes(currentUser?.role, userId);
  const clinicalAgentRoute = routes.clinicalAgentRoute;
  const importRoute = routes.importRoute;
  const medicalProfileRoute = routes.medicalProfileRoute;
  const healthKpisRoute = routes.healthKpisRoute;

  // Patient user info (username, email, phone, status, etc.)
  const { data: patientInfoData, isLoading: infoLoading } =
    useGetPatientProfile(userId);
  const patientInfo = useMemo(() => {
    if (!patientInfoData) return undefined;
    if (Array.isArray(patientInfoData)) return patientInfoData[0];
    return patientInfoData as any;
  }, [patientInfoData]);

  // EHR / medical profiles
  const { data: profilesData, isLoading: profilesLoading, error: profilesError } =
    useUserProfiles(userId);
  
  const profiles = useMemo(() => {
    if (!profilesData) return [];
    if (Array.isArray(profilesData)) return profilesData;
    return [profilesData]; // Handle case where it might be a single object
  }, [profilesData]);

  // Live vitals + history
  const { data: overViewData, isLoading: isOverviewLoading } = useGetOVerview(userId);
  const [metric, setMetric] = useState<Metric>("heart_rate");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("day");
  const metrics: Metric[] = [metric];
  const { data: historyData, isLoading: isHistoryLoading } = useHistory(
    userId,
    metrics,
    timePeriod
  );

  const overviewData: OverviewData | undefined = useMemo(() => {
    if (!overViewData) return undefined;
    return {
      wearable: {
        timestamp: overViewData.wearable?.timestamp ?? "",
        heart_rate: overViewData.wearable?.heart_rate ?? 0,
        bp_systolic: overViewData.wearable?.bp_systolic ?? 0,
        bp_diastolic: overViewData.wearable?.bp_diastolic ?? 0,
        spo2: overViewData.wearable?.spo2 ?? 0,
        activity: overViewData.wearable?.activity ?? "",
        temperature: overViewData.wearable?.temperature ?? 0,
      },
      environmental: {
        timestamp: overViewData.environmental?.timestamp ?? "",
        temperature: overViewData.environmental?.temperature ?? 0,
        humidity: overViewData.environmental?.humidity ?? 0,
        MQ25: overViewData.environmental?.MQ25
          ?? (overViewData.environmental as { mq2?: number } | undefined)?.mq2
          ?? 0,
        CO2: overViewData.environmental?.CO2 ?? 0,
      },
    };
  }, [overViewData]);

  const hasHistoryData =
    !!historyData &&
    !!historyData.data &&
    typeof historyData.data === "object" &&
    !Array.isArray(historyData.data) &&
    Array.isArray((historyData.data as Record<string, unknown[]>)[metric]) &&
    (historyData.data as Record<string, unknown[]>)[metric].length > 0;

  const chartHistoryData = useMemo(() => {
    if (hasHistoryData && historyData?.data) {
      return (
        (historyData.data as unknown) as Record<
          string,
          { timestamp: string; value: number }[]
        >
      )[metric];
    }
    return [];
  }, [hasHistoryData, historyData, metric, timePeriod]);

  const chartHistoryUnit = hasHistoryData
    ? historyData?.units?.[metric as keyof typeof historyData.units]
    : undefined;

  const showHistoryChart = chartHistoryData.length > 0;

  const handleMessagePatient = async () => {
    if (!patientInfo) return;
    setIsCreatingRoom(true);
    try {
      const response = await createRoomMutation.mutateAsync({
        target_username: patientInfo.username,
        room_name: patientInfo.username,
        topic: "General_discussion",
      });
      if (response?.room_id) {
        router.push(`/dashboard/chat/${response.room_id}`);
      }
    } catch (error) {
      console.error("Failed to start chat with patient:", error);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  if (infoLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <span className="animate-spin w-10 h-10 text-blue-500 mb-4 flex items-center justify-center">
            <LoaderIcon size={40} />
          </span>
          <span className="text-lg text-muted-foreground">Loading patient...</span>
        </div>
      </div>
    );
  }

  const fullName = patientInfo
    ? `${patientInfo.first_name} ${patientInfo.last_name}`
    : `Patient #${userId}`;

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(patientsListRoute)}
            className="h-auto self-start px-2 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 me-1 shrink-0" />
            <span className="truncate">{t("back_to_patients", "Back to Patients")}</span>
          </Button>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <Button
              variant="outline"
              className="h-10 w-full sm:w-auto"
              onClick={() => router.push(medicalProfileRoute)}
            >
              <FileHeart className="w-4 h-4 me-2 shrink-0" />
              <span className="truncate">{t("medical_profile", "Medical Profile")}</span>
            </Button>
            <Button
              variant="outline"
              className="h-10 w-full sm:w-auto"
              onClick={() => router.push(healthKpisRoute)}
            >
              <Gauge className="w-4 h-4 me-2 shrink-0" />
              <span className="truncate">{t("health_kpis", "Health KPIs")}</span>
            </Button>
            {(isDoctor || isCaregiver) && (
              <Button
                variant="outline"
                className="h-10 w-full sm:w-auto"
                onClick={() => router.push(importRoute)}
              >
                <FileUp className="w-4 h-4 me-2 shrink-0" />
                <span className="truncate">{t("import_records", "Import Records")}</span>
              </Button>
            )}
            <Button
              variant="outline"
              className="h-10 w-full sm:w-auto"
              onClick={() => router.push(clinicalAgentRoute)}
            >
              <Brain className="w-4 h-4 me-2 shrink-0" />
              <span className="truncate">{t("clinical_agent", "Clinical Agent")}</span>
            </Button>
            <Button
              onClick={handleMessagePatient}
              disabled={isCreatingRoom || !patientInfo}
              className="h-10 w-full sm:w-auto"
            >
              <MessageCircle className="w-4 h-4 me-2 shrink-0" />
              {isCreatingRoom
                ? t("starting_chat", "Starting chat...")
                : t("message_patient", "Message Patient")}
            </Button>
          </div>
        </div>

        <Heading
          title={fullName}
          description={
            patientInfo
              ? `@${patientInfo.username} • ${patientInfo.email}`
              : t("patient_overview", "Patient Overview")
          }
        />

        <StaffPatientNav role={currentUser?.role} patientId={userId} />

        <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <ProfileCard viewedUser={patientInfo} />
          </div>
          <div className="xl:col-span-8">
            <Ovreview
              userId={userId}
              patientName={
                patientInfo
                  ? `${patientInfo.first_name} ${patientInfo.last_name}`.trim()
                  : undefined
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <OverviewSection data={overviewData} isLoading={isOverviewLoading} />
          </div>

          <Card className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md xl:col-span-7">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight">
                {t("health_history", "Health History")}
              </h3>
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
              ) : showHistoryChart ? (
                <HistoryChart
                  data={chartHistoryData}
                  metric={metric}
                  timePeriod={timePeriod}
                  unit={chartHistoryUnit}
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

        {/* Medical Records (EHR) */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">
                {t("medical_records", "Medical Records")}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="h-9"
                onClick={() => router.push(medicalProfileRoute)}
              >
                <FileHeart className="w-4 h-4 me-2" />
                {t("view_full_profile", "View full profile & export")}
              </Button>
              {currentUser?.role === "doctor" && (
              <EditThresholdsModal
                userId={userId}
                defaultValues={{
                  diagnosis: "",
                  notes: "",
                  timestamp: new Date().toISOString().slice(0, 16),
                  medications: [],
                  symptoms: [],
                }}
                trigger={
                  <Button variant="default" className="h-9">
                    {t("edit_thresholds", "Edit Thresholds")}
                  </Button>
                }
              />
              )}
            </div>
          </div>

          {profilesLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Skeleton className="h-40 w-full max-w-3xl" />
            </div>
          ) : profilesError || !profiles ? (
            <Alert variant="destructive" className="max-w-3xl">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <AlertTitle>{t("error", "Error")}</AlertTitle>
              <AlertDescription>
                {t(
                  "error_loading_profile",
                  "Unable to load medical record. Please try again later."
                )}
              </AlertDescription>
            </Alert>
          ) : profiles.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-muted-foreground">
                {t("no_medical_records", "No medical records available.")}
              </CardContent>
            </Card>
          ) : (
            <div className="grid w-full max-w-4xl gap-6">
              {profiles.map((profile) => (
                <div key={profile.ehr_id} className="space-y-4">
                  <SectionCard title={t("diagnosis", "Diagnosis")}>
                    <p>{profile.diagnosis || t("no_diagnosis", "No diagnosis provided.")}</p>
                  </SectionCard>

                  <SectionCard title={t("physician_notes", "Physician Notes")}>
                    <p>{profile.physician_notes || t("no_notes", "No notes available.")}</p>
                  </SectionCard>

                  <SectionCard title={t("medications", "Medications")}>
                    {profile.medications?.length ? (
                      <ul className="list-disc list-inside">
                        {profile.medications.map((med) => (
                          <li key={med.id}>
                            <strong>{med.name}</strong> — {med.dosage}, {med.frequency}
                            {med.notes && <em> ({med.notes})</em>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>{t("no_medications", "No medications recorded.")}</p>
                    )}
                  </SectionCard>

                  <SectionCard title={t("symptoms", "Symptoms")}>
                    {profile.symptoms?.length ? (
                      <ul className="list-disc list-inside">
                        {profile.symptoms.map((symptom) => (
                          <li key={symptom.id}>
                            <strong>{symptom.name}</strong> — {t("severity", "Severity")}: {symptom.severity}
                            {symptom.notes && <em> ({symptom.notes})</em>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>{t("no_symptoms", "No symptoms reported.")}</p>
                    )}
                  </SectionCard>

                  <p className="text-xs text-muted-foreground text-right">
                    {t("recorded_on", "Recorded on")}:{" "}
                    {new Date(profile.timestamp).toLocaleString()}
                  </p>

                  <Separator className="my-4" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
