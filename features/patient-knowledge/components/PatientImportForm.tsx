"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileUp, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { useIngestKnowledge } from "../api/useIngestKnowledge";
import {
  DOCUMENT_TYPES,
  type DocumentType,
  type PatientProfileJson,
} from "../types/knowledge";
import { parsePatientKnowledgeError } from "../utils/patientKnowledgeErrors";
import type { ProfileFormSeed } from "../utils/profileMappers";
import { hasProfileContent } from "../utils/profileMappers";

const medicationSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  notes: z.string().optional(),
});

const symptomSchema = z.object({
  name: z.string().min(1),
  severity: z.string().min(1),
  onset_date: z.string().optional(),
  notes: z.string().optional(),
});

const profileSchema = z.object({
  diagnosis: z.string(),
  comorbidities: z.string(),
  physician_notes: z.string(),
  medical_history: z.string().optional(),
  age: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  gender: z.string().optional(),
  medications: z.array(medicationSchema),
  symptoms: z.array(symptomSchema),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const EMPTY_FORM_VALUES: ProfileFormValues = {
  diagnosis: "",
  comorbidities: "",
  physician_notes: "",
  medical_history: "",
  age: "",
  weight: "",
  height: "",
  gender: "",
  medications: [],
  symptoms: [],
};

interface UploadedFile {
  id: string;
  file: File;
  documentType: DocumentType;
}

interface PatientImportFormProps {
  userId: number;
  initialProfile?: ProfileFormSeed;
  onSubmitted?: () => void;
}

export function PatientImportForm({
  userId,
  initialProfile,
  onSubmitted,
}: PatientImportFormProps) {
  const { t } = useTranslation();
  const ingestMutation = useIngestKnowledge();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const defaultValues = useMemo(
    () => initialProfile ?? EMPTY_FORM_VALUES,
    [initialProfile]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const hasExistingProfile = Boolean(
    initialProfile?.diagnosis ||
      initialProfile?.physician_notes ||
      initialProfile?.medications.length ||
      initialProfile?.symptoms.length
  );

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    setUploadedFiles((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        documentType: "clinical_note" as DocumentType,
      })),
    ]);
  }, []);

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length) {
      addFiles(event.dataTransfer.files);
    }
  };

  const buildProfileJson = (data: ProfileFormValues): PatientProfileJson => {
    const comorbidities = data.comorbidities
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const demographics: PatientProfileJson["demographics"] = {};
    if (data.age) demographics.age = Number(data.age);
    if (data.weight) demographics.weight = Number(data.weight);
    if (data.height) demographics.height = Number(data.height);
    if (data.gender) demographics.gender = data.gender;

    const toIsoDate = (value?: string) => {
      if (!value) return undefined;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
    };

    return {
      diagnosis: data.diagnosis,
      comorbidities,
      demographics: Object.keys(demographics).length ? demographics : undefined,
      physician_notes: data.physician_notes,
      medical_history: data.medical_history,
      medications: data.medications.map((med) => ({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        start_date: toIsoDate(med.start_date),
        end_date: toIsoDate(med.end_date),
        notes: med.notes,
      })),
      symptoms: data.symptoms.map((sym) => ({
        name: sym.name,
        severity: sym.severity,
        onset_date: toIsoDate(sym.onset_date),
        notes: sym.notes,
      })),
    };
  };

  const onSubmit = handleSubmit(async (data) => {
    const profileJson = buildProfileJson(data);
    const files = uploadedFiles.map((item) => item.file);
    const hasFiles = files.length > 0;
    const hasProfile = hasProfileContent(profileJson);

    if (!hasProfile && !hasFiles) {
      toast.error(
        t(
          "import_requires_content",
          "Add profile details or upload at least one document before submitting."
        )
      );
      return;
    }

    try {
      const result = await ingestMutation.mutateAsync({
        userId,
        profileJson,
        files,
        documentTypes: uploadedFiles.map((item) => item.documentType),
      });
      toast.success(
        result.message ??
          t("import_submitted", "Patient knowledge submitted for indexing")
      );
      onSubmitted?.();
    } catch (err) {
      const parsed = parsePatientKnowledgeError(err);
      toast.error(parsed.message);
    }
  });

  return (
    <form onSubmit={onSubmit} className="min-w-0 space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">
            {hasExistingProfile
              ? t("update_structured_profile", "Update Structured Profile")
              : t("structured_profile", "Structured Profile")}
          </CardTitle>
          {hasExistingProfile && (
            <p className="text-sm text-muted-foreground">
              {t(
                "profile_prefilled_hint",
                "Fields below are pre-filled from the patient's existing record. Edit and submit to update indexing."
              )}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="diagnosis">{t("diagnosis", "Diagnosis")}</Label>
              <Input id="diagnosis" {...register("diagnosis")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comorbidities">{t("comorbidities", "Comorbidities")}</Label>
              <Input
                id="comorbidities"
                placeholder={t("comorbidities_placeholder", "Comma-separated")}
                {...register("comorbidities")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="age">{t("age", "Age")}</Label>
              <Input id="age" type="number" {...register("age")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">{t("weight", "Weight")}</Label>
              <Input id="weight" type="number" {...register("weight")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">{t("height", "Height")}</Label>
              <Input id="height" type="number" {...register("height")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">{t("gender", "Gender")}</Label>
              <Input id="gender" {...register("gender")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="physician_notes">{t("physician_notes", "Physician Notes")}</Label>
            <Textarea id="physician_notes" rows={3} {...register("physician_notes")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medical_history">{t("medical_history", "Medical History")}</Label>
            <Textarea id="medical_history" rows={3} {...register("medical_history")} />
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Label>{t("medications", "Medications")}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() =>
                  setValue("medications", [
                    ...watch("medications"),
                    { name: "", dosage: "", frequency: "" },
                  ])
                }
              >
                <Plus className="h-4 w-4 me-1" />
                {t("add_medication", "Add Medication")}
              </Button>
            </div>
            {watch("medications").map((_, idx) => (
              <div key={idx} className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-2">
                <Input placeholder={t("name", "Name")} {...register(`medications.${idx}.name`)} />
                <Input placeholder={t("dosage", "Dosage")} {...register(`medications.${idx}.dosage`)} />
                <Input placeholder={t("frequency", "Frequency")} {...register(`medications.${idx}.frequency`)} />
                <Input placeholder={t("notes", "Notes")} {...register(`medications.${idx}.notes`)} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full sm:col-span-2"
                  onClick={() =>
                    setValue(
                      "medications",
                      watch("medications").filter((_, i) => i !== idx)
                    )
                  }
                >
                  <Trash2 className="h-4 w-4 me-1" />
                  {t("remove", "Remove")}
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Label>{t("symptoms", "Symptoms")}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() =>
                  setValue("symptoms", [
                    ...watch("symptoms"),
                    { name: "", severity: "" },
                  ])
                }
              >
                <Plus className="h-4 w-4 me-1" />
                {t("add_symptom", "Add Symptom")}
              </Button>
            </div>
            {watch("symptoms").map((_, idx) => (
              <div key={idx} className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-2">
                <Input placeholder={t("name", "Name")} {...register(`symptoms.${idx}.name`)} />
                <Input placeholder={t("severity", "Severity")} {...register(`symptoms.${idx}.severity`)} />
                <Input placeholder={t("notes", "Notes")} {...register(`symptoms.${idx}.notes`)} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full sm:col-span-2"
                  onClick={() =>
                    setValue(
                      "symptoms",
                      watch("symptoms").filter((_, i) => i !== idx)
                    )
                  }
                >
                  <Trash2 className="h-4 w-4 me-1" />
                  {t("remove", "Remove")}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">{t("document_upload", "Document Upload")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition-colors sm:p-8",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30"
            )}
          >
            <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("drop_files_here", "Drop PDF or clinical files here")}
            </p>
            <label className="mt-3">
              <input
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={(event) => {
                  if (event.target.files?.length) addFiles(event.target.files);
                  event.target.value = "";
                }}
              />
              <Button type="button" variant="outline" asChild>
                <span>
                  <FileUp className="h-4 w-4 me-2" />
                  {t("browse_files", "Browse files")}
                </span>
              </Button>
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              {uploadedFiles.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
                >
                  <span className="min-w-0 flex-1 break-all text-sm font-medium sm:truncate">
                    {item.file.name}
                  </span>
                  <div className="flex w-full items-center gap-2 sm:w-auto sm:min-w-[220px]">
                    <Select
                      value={item.documentType}
                      onValueChange={(value: DocumentType) =>
                        setUploadedFiles((prev) =>
                          prev.map((entry) =>
                            entry.id === item.id
                              ? { ...entry, documentType: value }
                              : entry
                          )
                        )
                      }
                    >
                      <SelectTrigger className="min-w-0 flex-1 sm:w-[180px] sm:flex-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`doc_type_${type}`, type.replace(/_/g, " "))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() =>
                        setUploadedFiles((prev) =>
                          prev.filter((entry) => entry.id !== item.id)
                        )
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        type="submit"
        className="w-full sm:w-auto"
        disabled={isSubmitting || ingestMutation.isPending}
      >
        {ingestMutation.isPending
          ? t("submitting", "Submitting...")
          : t("submit_import", "Submit for indexing")}
      </Button>
    </form>
  );
}
