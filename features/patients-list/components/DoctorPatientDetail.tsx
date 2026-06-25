"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Activity, ArrowLeft, MessageCircle } from "lucide-react";

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
import { useUser } from "@/context/UserContext";

const heartRateList: number[] = [72, 74, 76, 78, 80, 82, 79, 77, 75, 73, 71, 70, 69, 68, 70, 72, 74, 76, 78, 80];
const bpSystolicList: number[] = [120, 122, 121, 119, 118, 117, 116, 115, 117, 119, 121, 123, 124, 122, 120, 118, 117, 119, 121, 120];
const bpDiastolicList: number[] = [80, 81, 79, 78, 77, 76, 75, 74, 76, 78, 80, 82, 83, 81, 80, 78, 77, 79, 80, 81];
const spo2List: number[] = [98, 97, 99, 98, 97, 96, 98, 99, 97, 98, 99, 98, 97, 96, 98, 99, 98, 97, 99, 98];
const temperatureList: number[] = [36.5, 36.6, 36.7, 36.8, 36.6, 36.5, 36.4, 36.3, 36.5, 36.6, 36.7, 36.8, 36.6, 36.5, 36.4, 36.3, 36.5, 36.6, 36.7, 36.8];
const envTemperatureList: number[] = [25, 26, 24, 23, 22, 21, 22, 23, 24, 25, 26, 27, 28, 27, 26, 25, 24, 23, 22, 21];
const humidityList: number[] = [50, 52, 54, 53, 51, 50, 49, 48, 50, 52, 54, 53, 51, 50, 49, 48, 50, 52, 54, 53];
const mq25List: number[] = [15, 16, 14, 13, 12, 13, 14, 15, 16, 15, 14, 13, 12, 13, 14, 15, 16, 15, 14, 13];
const co2List: number[] = [450, 455, 460, 458, 455, 452, 450, 448, 445, 450, 455, 460, 458, 455, 452, 450, 448, 445, 450, 455];

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

function generateMockOverviewData(index: number): OverviewData {
  const now = new Date().toISOString();
  return {
    wearable: {
      timestamp: now,
      heart_rate: heartRateList[index],
      bp_systolic: bpSystolicList[index],
      bp_diastolic: bpDiastolicList[index],
      spo2: spo2List[index],
      activity: "Sitting",
      temperature: temperatureList[index],
    },
    environmental: {
      timestamp: now,
      temperature: envTemperatureList[index],
      humidity: humidityList[index],
      MQ25: mq25List[index],
      CO2: co2List[index],
    },
  };
}

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
  const { data: overViewData } = useGetOVerview(userId);
  const [metric, setMetric] = useState<Metric>("heart_rate");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("day");
  const metrics: Metric[] = [metric];
  const { data: historyData, isLoading: isHistoryLoading } = useHistory(
    userId,
    metrics,
    timePeriod
  );

  const [metricIndex, setMetricIndex] = useState(0);
  const [mockOverviewData, setMockOverviewData] = useState<OverviewData>(
    generateMockOverviewData(0)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setMetricIndex((prev) => (prev + 1) % heartRateList.length);
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setMockOverviewData(generateMockOverviewData(metricIndex));
  }, [metricIndex]);

  const overviewData: OverviewData = useMemo(() => {
    if (!overViewData) return mockOverviewData;
    return {
      wearable: {
        timestamp: overViewData.wearable?.timestamp ?? mockOverviewData.wearable.timestamp,
        heart_rate: overViewData.wearable?.heart_rate ?? mockOverviewData.wearable.heart_rate,
        bp_systolic: overViewData.wearable?.bp_systolic ?? mockOverviewData.wearable.bp_systolic,
        bp_diastolic: overViewData.wearable?.bp_diastolic ?? mockOverviewData.wearable.bp_diastolic,
        spo2: overViewData.wearable?.spo2 ?? mockOverviewData.wearable.spo2,
        activity: overViewData.wearable?.activity ?? mockOverviewData.wearable.activity,
        temperature: overViewData.wearable?.temperature ?? mockOverviewData.wearable.temperature,
      },
      environmental: {
        timestamp: overViewData.environmental?.timestamp ?? mockOverviewData.environmental.timestamp,
        temperature: overViewData.environmental?.temperature ?? mockOverviewData.environmental.temperature,
        humidity: overViewData.environmental?.humidity ?? mockOverviewData.environmental.humidity,
        MQ25: overViewData.environmental?.MQ25 ?? mockOverviewData.environmental.MQ25,
        CO2: overViewData.environmental?.CO2 ?? mockOverviewData.environmental.CO2,
      },
    };
  }, [overViewData, mockOverviewData]);

  const hasHistoryData =
    !!historyData &&
    !!historyData.data &&
    typeof historyData.data === "object" &&
    !Array.isArray(historyData.data) &&
    Array.isArray((historyData.data as Record<string, unknown[]>)[metric]) &&
    (historyData.data as Record<string, unknown[]>)[metric].length > 0;

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/patients")}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 me-1" />
            {t("back_to_patients", "Back to Patients")}
          </Button>
          <Button
            onClick={handleMessagePatient}
            disabled={isCreatingRoom || !patientInfo}
            className="h-10"
          >
            <MessageCircle className="w-4 h-4 me-2" />
            {isCreatingRoom
              ? t("starting_chat", "Starting chat...")
              : t("message_patient", "Message Patient")}
          </Button>
        </div>

        <Heading
          title={fullName}
          description={
            patientInfo
              ? `@${patientInfo.username} • ${patientInfo.email}`
              : t("patient_overview", "Patient Overview")
          }
        />

        <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <ProfileCard viewedUser={patientInfo} />
          </div>
          <div className="xl:col-span-8">
            <Ovreview userId={userId} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <OverviewSection data={overviewData} />
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
              ) : hasHistoryData ? (
                <HistoryChart
                  data={((historyData.data as unknown) as Record<
                    string,
                    { timestamp: string; value: number }[]
                  >)[metric]}
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

        {/* Medical Records (EHR) */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">
                {t("medical_records", "Medical Records")}
              </h2>
            </div>
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
