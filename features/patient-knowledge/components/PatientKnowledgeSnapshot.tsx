"use client";

import { useTranslation } from "react-i18next";
import { FileText, Loader2, Pill, Stethoscope, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useDeletePatientDocument } from "../api/useDeletePatientDocument";
import type {
  KnowledgeDocument,
  PatientKnowledgeResponse,
  PatientProfileJson,
} from "../types/knowledge";
import {
  documentDisplayName,
  documentStatusLabel,
  knowledgeLabel,
} from "../utils/knowledgeLabels";
import {
  hasProfileContent,
  normalizePatientKnowledgeResponse,
  patientDisplayName,
} from "../utils/profileMappers";

interface PatientKnowledgeSnapshotProps {
  data: PatientKnowledgeResponse;
  onRefetch?: () => void;
}

export function PatientKnowledgeSnapshot({
  data,
  onRefetch,
}: PatientKnowledgeSnapshotProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeletePatientDocument();
  const normalized = normalizePatientKnowledgeResponse(data);
  const profile = normalized.profile;
  const hasProfile = profile && hasProfileContent(profile);
  const userId = normalized.patient.user_id;
  const deletingId = deleteMutation.isPending
    ? deleteMutation.variables?.documentId
    : null;

  const handleDelete = async (doc: KnowledgeDocument) => {
    if (doc.id == null) {
      toast.error(t("delete_document_missing_id", "Cannot delete this document."));
      return;
    }
    const confirmed = window.confirm(
      t(
        "delete_document_confirm",
        "Delete this document? This removes the file and its indexed chunks."
      )
    );
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync({
        userId,
        documentId: Number(doc.id),
      });
      toast.success(t("delete_document_success", "Document deleted"));
      onRefetch?.();
    } catch {
      toast.error(t("delete_document_failed", "Failed to delete document"));
    }
  };

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="px-4 sm:px-6 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg sm:text-xl">
              {t("existing_patient_record", "Existing Patient Record")}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {patientDisplayName(normalized)}
              {normalized.patient.age != null && (
                <span>
                  {" "}
                  · {normalized.patient.age} {t("years", "yrs")}
                </span>
              )}
              <span> · ID {normalized.patient.user_id}</span>
            </p>
          </div>
          <Badge variant="outline" className="shrink-0">
            {knowledgeLabel(normalized.knowledge.refresh_status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-4 sm:px-6">
        {!hasProfile ? (
          <p className="text-sm text-muted-foreground">
            {t(
              "no_profile_on_file",
              "No structured profile on file yet. Complete the form below to create one."
            )}
          </p>
        ) : (
          <ExistingProfileDetails profile={profile} />
        )}

        {normalized.documents.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("uploaded_documents", "Uploaded Documents")}
            </p>
            <ul className="space-y-1.5">
              {normalized.documents.map((doc, index) => {
                const docId = doc.id != null ? Number(doc.id) : null;
                const isDeleting = deletingId != null && docId === deletingId;
                return (
                  <li
                    key={String(doc.id ?? doc.filename ?? index)}
                    className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">
                      {documentDisplayName(doc)}
                    </span>
                    {doc.document_type && (
                      <Badge variant="secondary" className="shrink-0 capitalize">
                        {String(doc.document_type).replace(/_/g, " ")}
                      </Badge>
                    )}
                    {doc.status && (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {documentStatusLabel(doc.status)}
                      </Badge>
                    )}
                    {docId != null && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deleteMutation.isPending}
                        aria-label={t("delete_document", "Delete document")}
                        onClick={() => handleDelete(doc)}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat
            label={t("medications", "Medications")}
            value={profile?.medications?.length ?? 0}
          />
          <MiniStat
            label={t("symptoms", "Symptoms")}
            value={profile?.symptoms?.length ?? 0}
          />
          <MiniStat
            label={t("documents", "Documents")}
            value={normalized.documents.length}
          />
          <MiniStat
            label={t("chunks", "Chunks")}
            value={normalized.knowledge.chunk_count ?? 0}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ExistingProfileDetails({ profile }: { profile: PatientProfileJson }) {
  const { t } = useTranslation();
  const demographics =
    typeof profile.demographics === "object" && profile.demographics
      ? profile.demographics
      : typeof profile.demographics === "string" && profile.demographics.trim()
        ? (() => {
            try {
              const parsed = JSON.parse(profile.demographics);
              return parsed && typeof parsed === "object" ? parsed : null;
            } catch {
              return null;
            }
          })()
        : null;
  const comorbidityList = Array.isArray(profile.comorbidities)
    ? profile.comorbidities.map(String).filter(Boolean)
    : profile.comorbidities && typeof profile.comorbidities === "object"
      ? Object.entries(profile.comorbidities).map(([k, v]) =>
          v && String(v).toLowerCase() !== "true" && String(v) !== k
            ? `${k}: ${v}`
            : k
        )
      : [];

  return (
    <div className="space-y-4 rounded-xl border bg-muted/10 p-4">
      {profile.diagnosis && (
        <SnapshotBlock label={t("diagnosis", "Diagnosis")} value={profile.diagnosis} />
      )}

      {comorbidityList.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("comorbidities", "Comorbidities")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {comorbidityList.map((item) => (
              <Badge key={item} variant="secondary">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(profile.allergies) && profile.allergies.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("allergies", "Allergies")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.allergies.map((item) => (
              <Badge
                key={item}
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
              >
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {demographics && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {demographics.age != null && (
            <DemographicChip label={t("age", "Age")} value={`${demographics.age}`} />
          )}
          {demographics.gender && (
            <DemographicChip label={t("gender", "Gender")} value={demographics.gender} />
          )}
          {demographics.weight != null && (
            <DemographicChip label={t("weight", "Weight")} value={`${demographics.weight} kg`} />
          )}
          {demographics.height != null && (
            <DemographicChip label={t("height", "Height")} value={`${demographics.height} cm`} />
          )}
        </div>
      )}

      {profile.physician_notes && (
        <SnapshotBlock
          label={t("physician_notes", "Physician Notes")}
          value={profile.physician_notes}
        />
      )}

      {profile.medical_history && (
        <SnapshotBlock
          label={t("medical_history", "Medical History")}
          value={
            typeof profile.medical_history === "string"
              ? profile.medical_history
              : profile.medical_history
                  .map((item) =>
                    item.level ? `${item.name} (${item.level})` : item.name
                  )
                  .join("\n")
          }
        />
      )}

      {profile.medications?.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Pill className="h-3.5 w-3.5" />
            {t("medications", "Medications")}
          </p>
          <div className="space-y-2">
            {profile.medications.map((med, index) => (
              <div
                key={`${med.name}-${index}`}
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <p className="font-medium">{med.name}</p>
                <p className="text-muted-foreground">
                  {[med.dosage, med.frequency].filter(Boolean).join(" · ")}
                </p>
                {med.notes && (
                  <p className="mt-1 text-xs text-muted-foreground">{med.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.symptoms?.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Stethoscope className="h-3.5 w-3.5" />
            {t("symptoms", "Symptoms")}
          </p>
          <div className="space-y-2">
            {profile.symptoms.map((sym, index) => (
              <div
                key={`${sym.name}-${index}`}
                className="flex flex-wrap items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <span className="font-medium">{sym.name}</span>
                {sym.severity && (
                  <Badge variant="outline" className="capitalize">
                    {sym.severity}
                  </Badge>
                )}
                {sym.notes && (
                  <span className="text-xs text-muted-foreground">{sym.notes}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SnapshotBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{value}</p>
    </div>
  );
}

function DemographicChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-2 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
