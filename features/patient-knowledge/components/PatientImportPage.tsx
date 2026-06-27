"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { LoaderIcon } from "@/components/chat/icons";
import { useUser } from "@/context/UserContext";
import { useGetPatientProfile } from "@/features/patients-list/api/use-get-patient-profile";

import { PatientImportForm } from "./PatientImportForm";
import { KnowledgeStatusPanel } from "./KnowledgeStatusPanel";

export function PatientImportPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user } = useUser();
  const [pollStatus, setPollStatus] = useState(false);

  const userId = Number(Array.isArray(params.id) ? params.id[0] : params.id);

  const { data: patientInfoData, isLoading } = useGetPatientProfile(userId);
  const patientInfo = useMemo(() => {
    if (!patientInfoData) return undefined;
    if (Array.isArray(patientInfoData)) return patientInfoData[0];
    return patientInfoData as { first_name?: string; last_name?: string; id?: number };
  }, [patientInfoData]);

  useEffect(() => {
    if (user === null) return;

    if (!user?.id) {
      router.replace("/auth/sign-in");
      return;
    }

    if (user.role !== "doctor") {
      toast.error(t("import_doctor_only", "Patient import is available to doctors only"));
      switch (user.role) {
        case "caregiver":
          router.replace("/dashboard/my-patients");
          break;
        case "admin":
          router.replace("/dashboard/users");
          break;
        default:
          router.replace("/dashboard/overview");
          break;
      }
    }
  }, [user, router, t]);

  if (isLoading || user === null || user.role !== "doctor") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <span className="animate-spin w-10 h-10 text-blue-500 mb-4 flex items-center justify-center">
            <LoaderIcon size={40} />
          </span>
          <span className="text-lg text-muted-foreground">{t("loading", "Loading...")}</span>
        </div>
      </div>
    );
  }

  const fullName = patientInfo
    ? `${patientInfo.first_name ?? ""} ${patientInfo.last_name ?? ""}`.trim()
    : `Patient #${userId}`;

  return (
    <PageContainer scrollable>
      <div className="flex w-full min-w-0 max-w-full flex-col gap-6 overflow-x-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/patients/${userId}`)}
            className="h-auto px-2 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 me-1 shrink-0" />
            <span className="truncate">{t("back_to_patient", "Back to Patient")}</span>
          </Button>
        </div>

        <Heading
          title={t("import_records", "Import Records")}
          description={`${fullName} • ID ${userId}`}
        />

        <PatientImportForm
          userId={userId}
          onSubmitted={() => setPollStatus(true)}
        />

        <KnowledgeStatusPanel
          userId={userId}
          poll={pollStatus}
          clinicalAgentHref={`/dashboard/patients/${userId}/clinical-agent`}
        />
      </div>
    </PageContainer>
  );
}
