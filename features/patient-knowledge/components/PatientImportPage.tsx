"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { LoaderIcon } from "@/components/chat/icons";
import { useUser } from "@/context/UserContext";
import { usePatientImportRecords } from "@/features/patient-knowledge/api/usePatientKnowledge";

import { PatientImportForm } from "./PatientImportForm";
import { KnowledgeStatusPanel } from "./KnowledgeStatusPanel";
import { PatientKnowledgeSnapshot } from "./PatientKnowledgeSnapshot";
import {
  formSeedKey,
  patientDisplayName,
  profileToFormSeed,
} from "../utils/profileMappers";
import { parsePatientKnowledgeError } from "../utils/patientKnowledgeErrors";
import { isStaffRole, staffPatientRoutes, patientPublicRef } from "../utils/staffRoutes";
import { useGetPatientProfile } from "@/features/patients-list/api/use-get-patient-profile";

export function PatientImportPage({
  patientId: patientIdProp,
}: {
  patientId?: number;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user } = useUser();
  const [pollStatus, setPollStatus] = useState(false);

  const routeRef = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data: patientInfo } = useGetPatientProfile(
    patientIdProp ?? routeRef,
  );
  const patientId = patientIdProp ?? patientInfo?.id;
  const routes = staffPatientRoutes(
    user?.role,
    patientInfo ? patientPublicRef(patientInfo) : routeRef || "",
  );

  const {
    data: knowledgeData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = usePatientImportRecords(patientId, { poll: pollStatus });

  const formSeed = useMemo(
    () => (knowledgeData ? profileToFormSeed(knowledgeData) : undefined),
    [knowledgeData]
  );

  const formRemountKey = useMemo(
    () => (formSeed ? formSeedKey(formSeed) : "empty"),
    [formSeed]
  );

  const loadError = isError ? parsePatientKnowledgeError(error) : null;

  useEffect(() => {
    const status = knowledgeData?.knowledge?.refresh_status;
    if (status === "ready" || status === "failed") {
      setPollStatus(false);
    }
  }, [knowledgeData?.knowledge?.refresh_status]);

  useEffect(() => {
    if (loadError?.kind === "not_found") {
      toast.error(loadError.message);
      router.replace(routes.listRoute);
    }
  }, [loadError, router, routes.listRoute]);

  useEffect(() => {
    if (user === null) return;

    if (!user?.id) {
      router.replace("/auth/sign-in");
      return;
    }

    if (!isStaffRole(user.role)) {
      toast.error(
        t("import_staff_only", "Import Records is available to doctors and caregivers only")
      );
      switch (user.role) {
        case "admin":
          router.replace("/dashboard/users");
          break;
        default:
          router.replace("/dashboard/overview");
          break;
      }
    }
  }, [user, router, t]);

  if (isLoading || user === null || !isStaffRole(user.role) || !patientId) {
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

  if (loadError?.kind === "not_found") {
    return null;
  }

  const fullName = knowledgeData
    ? patientDisplayName(knowledgeData)
    : `Patient #${patientId}`;

  const startPolling = () => {
    setPollStatus(true);
    void refetch();
  };

  return (
    <PageContainer scrollable>
      <div className="flex w-full min-w-0 max-w-full flex-col gap-6 overflow-x-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(routes.detailRoute)}
            className="h-auto px-2 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 me-1 shrink-0" />
            <span className="truncate">{t("back_to_patient", "Back to Patient")}</span>
          </Button>
        </div>

        <Heading
          title={t("import_records", "Import Records")}
          description={`${fullName} • ID ${patientId}`}
        />

        {loadError && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>
              {loadError.kind === "forbidden"
                ? t("access_denied", "Access denied")
                : t("load_failed", "Failed to load patient record")}
            </AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>{loadError.message}</span>
              {loadError.kind !== "forbidden" && (
                <Button variant="outline" size="sm" onClick={() => void refetch()}>
                  {t("retry", "Retry")}
                </Button>
              )}
              {loadError.kind === "forbidden" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(routes.listRoute)}
                >
                  {t("back_to_list", "Back to patient list")}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {knowledgeData && <PatientKnowledgeSnapshot data={knowledgeData} />}

        {!loadError && (
          <PatientImportForm
            key={`${patientId}-${formRemountKey}`}
            userId={patientId}
            initialProfile={formSeed}
            onSubmitted={startPolling}
          />
        )}

        {!loadError && (
          <KnowledgeStatusPanel
            userId={patientId}
            knowledge={knowledgeData?.knowledge}
            documents={knowledgeData?.documents}
            isLoading={false}
            isFetching={isFetching}
            poll={pollStatus}
            clinicalAgentHref={routes.clinicalAgentRoute}
            onRefetch={() => void refetch()}
            onReindexStarted={startPolling}
          />
        )}
      </div>
    </PageContainer>
  );
}
