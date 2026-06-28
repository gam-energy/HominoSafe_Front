"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useKnowledgeStatus } from "../api/useKnowledgeStatus";
import { useRefreshKnowledge } from "../api/useRefreshKnowledge";
import type { KnowledgeStatusResponse } from "../types/knowledge";

interface KnowledgeStatusPanelProps {
  userId: number;
  poll?: boolean;
  clinicalAgentHref: string;
}

const statusVariant = (status?: string) => {
  switch (status) {
    case "ready":
      return "default" as const;
    case "failed":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
};

export function KnowledgeStatusPanel({
  userId,
  poll = false,
  clinicalAgentHref,
}: KnowledgeStatusPanelProps) {
  const { t } = useTranslation();
  const refreshMutation = useRefreshKnowledge();
  const { data, isLoading, isFetching, refetch } = useKnowledgeStatus(userId, {
    poll,
  });

  const handleRefresh = async () => {
    try {
      await refreshMutation.mutateAsync(userId);
      toast.success(t("reindex_started", "Re-indexing started"));
      void refetch();
    } catch {
      toast.error(t("reindex_failed", "Failed to start re-indexing"));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-8">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{t("loading_status", "Loading knowledge status...")}</span>
        </CardContent>
      </Card>
    );
  }

  const status = data as KnowledgeStatusResponse | undefined;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col items-start gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <CardTitle className="text-lg sm:text-xl">{t("knowledge_status", "Knowledge Status")}</CardTitle>
        <Badge variant={statusVariant(status?.refresh_status)} className="shrink-0">
          {status?.refresh_status ?? t("unknown", "Unknown")}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4 px-4 sm:px-6">
        {(poll || status?.refresh_status === "processing" || status?.refresh_status === "pending") && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("indexing_in_progress", "Indexing in progress...")}
            {isFetching && !isLoading && (
              <span className="text-xs">({t("polling", "polling")})</span>
            )}
          </div>
        )}

        {status?.refresh_status === "failed" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("indexing_failed", "Indexing failed")}</AlertTitle>
            <AlertDescription>
              {status.error ?? t("indexing_failed_desc", "Please try re-indexing.")}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label={t("documents", "Documents")} value={status?.document_count ?? 0} />
          <Stat label={t("chunks", "Chunks")} value={status?.chunk_count ?? 0} />
          <Stat
            label={t("last_ingested", "Last ingested")}
            value={
              status?.last_ingested_at
                ? new Date(status.last_ingested_at).toLocaleString()
                : "—"
            }
          />
        </div>

        {status?.summary && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="mb-2 text-sm font-semibold">
              {t("ai_knowledge_summary", "AI Knowledge Summary")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {status.summary}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleRefresh}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw className="h-4 w-4 me-2" />
            {t("reindex", "Re-index")}
          </Button>

          {status?.refresh_status === "ready" && (
            <Button asChild className="w-full sm:w-auto">
              <Link href={clinicalAgentHref}>
                <CheckCircle2 className="h-4 w-4 me-2" />
                {t("view_clinical_agent", "View Clinical Agent")}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words text-sm font-semibold">{value}</p>
    </div>
  );
}
