"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import PageContainer from "@/components/layout/page-container";
import { LoaderIcon } from "@/components/chat/icons";
import { ArrowLeft, Brain, Play, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { useUser } from "@/context/UserContext";
import { useGetPatientProfile } from "@/features/patients-list/api/use-get-patient-profile";
import { useKnowledgeStatus } from "@/features/patient-knowledge/api/useKnowledgeStatus";
import { staffPatientRoutes } from "@/features/patient-knowledge/utils/staffRoutes";
import { useCdsReport } from "../api/useCdsReport";
import { useCdsAnalyze } from "../api/useCdsAnalyze";
import { AnalyzeLoadingOverlay } from "./AnalyzeLoadingOverlay";
import { FindingsList } from "./FindingsList";
import { PhysicianFeedbackForm } from "./PhysicianFeedbackForm";
import { RecommendationsList } from "./RecommendationsList";
import { DecisionGraphPanel } from "./DecisionGraphPanel.lazy";
import { ScheduledReportsPanel } from '@/features/clinical-reports/components/ScheduledReportsPanel';
import { CnnResultsCard } from '@/features/predictions/components/CnnResultsCard';

export function ClinicalAgentReport() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user } = useUser();
  const patientId = Number(Array.isArray(params.id) ? params.id[0] : params.id);
  const isDoctor = user?.role === "doctor";
  const isCaregiver = user?.role === "caregiver";
  const routes = staffPatientRoutes(user?.role, patientId);
  const backHref = routes.detailRoute;
  const importHref =
    isDoctor || isCaregiver ? routes.importRoute : undefined;

  const { data: patientInfoData, isLoading: patientLoading } =
    useGetPatientProfile(patientId);
  const { data: knowledgeStatus } = useKnowledgeStatus(patientId);
  const { data: report, isLoading: reportLoading, refetch } = useCdsReport(patientId);
  const analyzeMutation = useCdsAnalyze();

  const patientInfo = useMemo(() => {
    if (!patientInfoData) return undefined;
    if (Array.isArray(patientInfoData)) return patientInfoData[0];
    return patientInfoData as { first_name?: string; last_name?: string };
  }, [patientInfoData]);

  const knowledgeReady = knowledgeStatus?.refresh_status === "ready";

  const handleAnalyze = async (forceRefresh = false) => {
    try {
      await analyzeMutation.mutateAsync({
        patientId,
        body: { force_refresh: forceRefresh, include_history_hours: 72 },
      });
      toast.success(t("analysis_complete", "Clinical analysis complete"));
      void refetch();
    } catch {
      toast.error(t("analysis_failed", "Clinical analysis failed. Please try again."));
    }
  };

  if (patientLoading) {
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
    : `Patient #${patientId}`;

  return (
    <PageContainer scrollable>
      {analyzeMutation.isPending && <AnalyzeLoadingOverlay />}

      <div className="flex w-full min-w-0 max-w-full flex-col gap-6 overflow-x-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(backHref)}
            className="h-auto px-2 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 me-1 shrink-0" />
            <span className="truncate">{t("back_to_patient", "Back to Patient")}</span>
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <Heading
              title={t("clinical_agent", "Clinical Agent")}
              description={`${fullName} • ID ${patientId}`}
            />
          </div>
          <Badge
            variant={knowledgeReady ? "default" : "secondary"}
            className="w-fit shrink-0 self-start"
          >
            {knowledgeReady
              ? t("knowledge_ready", "Knowledge ready")
              : t("knowledge_not_ready", "Knowledge not indexed")}
          </Badge>
        </div>

        {!knowledgeReady && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("knowledge_not_indexed", "Patient knowledge not indexed")}</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                {t(
                  "knowledge_not_indexed_desc",
                  "Import and index patient records before running clinical analysis."
                )}
              </p>
              {isDoctor && importHref && (
                <Button asChild variant="outline" size="sm">
                  <Link href={importHref}>{t("import_records", "Import Records")}</Link>
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Card className="overflow-hidden">
          <CardHeader className="space-y-4 px-4 sm:px-6">
            <div className="min-w-0 space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Brain className="h-5 w-5 shrink-0 text-primary" />
                <span className="min-w-0">{t("report_status", "Report Status")}</span>
              </CardTitle>
              <div className="space-y-1 text-xs text-muted-foreground sm:text-sm">
                <p className="break-words">
                  {report?.overall_status
                    ? `${t("overall_status", "Overall status")}: ${report.overall_status}`
                    : t("no_report_yet", "No report yet")}
                </p>
                {report?.analyzed_at && (
                  <p className="break-words">
                    {t("last_analyzed", "Last analyzed")}:{" "}
                    {new Date(report.analyzed_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            {isDoctor && (
              <Button
                className="w-full sm:w-auto"
                onClick={() => handleAnalyze(!!report)}
                disabled={analyzeMutation.isPending || !knowledgeReady}
              >
                <Play className="h-4 w-4 me-2" />
                {report
                  ? t("rerun_analysis", "Re-run Analysis")
                  : t("run_analysis", "Run Analysis")}
              </Button>
            )}
          </CardHeader>
        </Card>

        <CnnResultsCard userId={patientId} compact />

        <ScheduledReportsPanel patientId={patientId} />

        {reportLoading ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              {t("loading_report", "Loading clinical report...")}
            </CardContent>
          </Card>
        ) : !report ? (
          <Card>
            <CardContent className="py-10 text-center space-y-3">
              <p className="text-muted-foreground">
                {knowledgeReady
                  ? t("run_first_analysis", "Run the first analysis to generate a clinical report.")
                  : t("index_patient_first", "Index patient knowledge before generating a report.")}
              </p>
              {isDoctor && knowledgeReady && (
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => handleAnalyze(false)}
                  disabled={analyzeMutation.isPending}
                >
                  <Play className="h-4 w-4 me-2" />
                  {t("run_analysis", "Run Analysis")}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-lg font-bold">{t("critical_findings", "Critical Findings")}</h2>
              <FindingsList findings={report.critical_findings ?? []} />
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold">{t("recommendations", "Recommendations")}</h2>
              <RecommendationsList recommendations={report.recommendations ?? []} />
            </section>

            {report.specialist_outputs?.length ? (
              <section className="space-y-3">
                <h2 className="text-lg font-bold">
                  {t("agent_reasoning", "How the agent decided")}
                </h2>
                <Accordion type="single" collapsible className="rounded-lg border px-2 sm:px-4">
                  {report.specialist_outputs.map((output, index) => (
                    <AccordionItem key={`${output.specialist}-${index}`} value={`specialist-${index}`}>
                      <AccordionTrigger className="text-start break-words">
                        {output.specialist}
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2">
                        <p className="text-sm leading-relaxed">{output.summary}</p>
                        {output.evidence?.length ? (
                          <ul className="list-disc ps-5 text-sm text-muted-foreground">
                            {output.evidence.map((item, evidenceIndex) => (
                              <li key={evidenceIndex}>{item}</li>
                            ))}
                          </ul>
                        ) : null}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            ) : null}

            <DecisionGraphPanel
              decisionGraph={report.decision_graph}
              causalGraph={report.causal_graph}
              showDecisionFallback
            />

            {report.reasoning_trace && (
              <Card className="overflow-hidden">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-lg sm:text-xl">
                    {t("reasoning_trace", "Reasoning Trace")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <p className="break-words text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                    {report.reasoning_trace}
                  </p>
                </CardContent>
              </Card>
            )}

            {isDoctor && <PhysicianFeedbackForm patientId={patientId} />}
          </>
        )}
      </div>
    </PageContainer>
  );
}
