"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useProfile } from "@/features/medical-profile/api/useGetMedicalProfile";
import { useUpdateAllergies } from "@/features/medical-profile/api/useUpdateAllergies";
import { normalizeComorbidities, parseDemographics } from "@/features/medical-profile/utils/profile";
import type { Symptom } from "@/features/medical-profile/types/medicalprofile";
import Link from "next/link";
import { useUserProfiles } from "@/features/patients-list/api/useUserProfiles";
import {
  pickLatestUserProfile,
} from "@/features/patients-list/utils/mapUserProfileToProfileData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { useUser } from "@/context/UserContext";
import PageContainer from "@/components/layout/page-container";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  User,
  HeartPulse,
  Stethoscope,
  FileText,
  Pill,
  Activity,
  Clock,
  ClipboardList,
  FileHeart,
  ShieldAlert,
} from "lucide-react";
import { LoaderIcon } from "@/components/chat/icons";
import { MedicationsList } from "./MedicationsList";
import { MedicalProfileExportMenu } from "./MedicalProfileExportMenu";
import type { MedicalProfileReportData } from "@/features/medical-profile/utils/exportMedicalProfileReport";
import type { ProfileData } from "@/features/medical-profile/types/medicalprofile";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function formatLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseAllergyInput(value: string): string[] {
  return value
    .split(/[,،;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function AllergiesEditor({
  allergies,
  userId,
}: {
  allergies: string[];
  userId?: number;
}) {
  const { t } = useTranslation();
  const update = useUpdateAllergies();
  const [draft, setDraft] = useState(allergies.join(", "));

  useEffect(() => {
    setDraft(allergies.join(", "));
  }, [allergies]);

  const canSave = typeof userId === "number" && userId > 0;

  return (
    <div className="space-y-3">
      {allergies.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("no_allergies")}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {allergies.map((name) => (
            <Badge
              key={name}
              variant="outline"
              className="rounded-full border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
            >
              {name}
            </Badge>
          ))}
        </div>
      )}
      {canSave && (
        <div className="flex flex-col gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t(
              "allergies_placeholder",
              "e.g. Penicillin, Peanut (comma-separated)"
            )}
            className="h-9 w-full text-sm"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="self-end"
            disabled={update.isPending}
            onClick={() =>
              update.mutate({
                userId: userId!,
                allergies: parseAllergyInput(draft),
              })
            }
          >
            {update.isPending
              ? t("saving", "Saving…")
              : t("save_allergies", "Save allergies")}
          </Button>
        </div>
      )}
    </div>
  );
}

function severityStyle(severity: string): string {
  const s = severity.toLowerCase();
  if (s.includes("high") || s.includes("severe") || s.includes("critical")) {
    return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";
  }
  if (s.includes("moderate") || s.includes("medium")) {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
  }
  return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
}

function SectionShell({
  icon: Icon,
  iconClass,
  iconBg,
  title,
  description,
  children,
  className,
}: {
  icon: typeof User;
  iconClass: string;
  iconBg: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent opacity-60",
          iconBg.replace("/10", "/5")
        )}
      />
      <CardHeader className="relative pb-3">
        <div className="flex items-start gap-3">
          <div className={cn("rounded-xl p-2.5 shrink-0", iconBg)}>
            <Icon className={cn("h-5 w-5", iconClass)} />
          </div>
          <div className="min-w-0 space-y-0.5">
            <CardTitle className="text-base font-bold tracking-tight">{title}</CardTitle>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative pt-0">{children}</CardContent>
    </Card>
  );
}

function SymptomRow({ symptom }: { symptom: Symptom }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50">
      <div className="min-w-0 space-y-1">
        <p className="font-semibold text-sm text-foreground">{symptom.name}</p>
        {symptom.onset_date && (
          <p className="text-xs text-muted-foreground">
            {t("onset", "Onset")}:{" "}
            {new Date(symptom.onset_date).toLocaleDateString()}
          </p>
        )}
        {symptom.notes && (
          <p className="text-xs italic text-muted-foreground border-s-2 border-primary/30 ps-2.5">
            {symptom.notes}
          </p>
        )}
      </div>
      <Badge
        variant="outline"
        className={cn("shrink-0 capitalize", severityStyle(symptom.severity))}
      >
        {symptom.severity}
      </Badge>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-48 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    </PageContainer>
  );
}

function formatExportDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function buildMedicalProfileReport(
  data: ProfileData,
  pageTitle: string,
  patientName: string,
  userId?: number
): MedicalProfileReportData {
  const comorbidityEntries = normalizeComorbidities(data.comorbidities);
  const medications = data.medications ?? [];
  const symptoms = data.symptoms ?? [];
  const allergies = data.allergies ?? [];

  return {
    pageTitle,
    patientName,
    userId,
    ehrId: data.ehr_id > 0 ? data.ehr_id : undefined,
    generatedAt: new Date().toLocaleString(),
    lastUpdated: data.timestamp
      ? new Date(data.timestamp).toLocaleString()
      : undefined,
    demographics: (() => {
      const parsed = parseDemographics(data.demographics);
      if (!parsed) return "";
      if (parsed.raw) return parsed.raw;
      return [
        parsed.age != null ? `Age ${parsed.age}` : null,
        parsed.gender ? `Gender ${parsed.gender}` : null,
        parsed.weight != null ? `Weight ${parsed.weight} kg` : null,
        parsed.height != null ? `Height ${parsed.height} cm` : null,
      ]
        .filter(Boolean)
        .join(" · ");
    })(),
    diagnosis: data.diagnosis,
    physicianNotes: data.physician_notes,
    comorbidities: comorbidityEntries.map(([key, value]) => ({
      label: formatLabel(key),
      value: value || "Present",
    })),
    allergies,
    medications: medications.map((med) => ({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      startDate: formatExportDate(med.start_date),
      endDate: formatExportDate(med.end_date),
      notes: med.notes,
      active: !med.end_date || new Date(med.end_date) >= new Date(),
    })),
    symptoms: symptoms.map((s) => ({
      name: s.name,
      severity: s.severity,
      onsetDate: s.onset_date ? formatExportDate(s.onset_date) : undefined,
      notes: s.notes,
    })),
    stats: {
      conditions: comorbidityEntries.length,
      allergies: allergies.length,
      medications: medications.length,
      symptoms: symptoms.length,
    },
  };
}

function HeroTitleRow({
  pageTitle,
  ehrId,
  exportMenu,
}: {
  pageTitle: string;
  ehrId?: number;
  exportMenu?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4 min-w-0">
        <div className="rounded-2xl bg-primary/10 p-3.5 shrink-0 dark:bg-blue-500/15">
          <FileHeart className="h-7 w-7 text-primary dark:text-blue-400" />
        </div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl truncate">
          {pageTitle}
        </h1>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {ehrId != null && ehrId > 0 && (
          <Badge variant="outline" className="font-mono text-xs">
            EHR #{ehrId}
          </Badge>
        )}
        {exportMenu}
      </div>
    </div>
  );
}

export type MedicalProfileViewProps = {
  patientId?: number;
  patientName?: string;
  backRoute?: string;
};

export function MedicalProfileView({
  patientId,
  patientName: patientNameProp,
  backRoute,
}: MedicalProfileViewProps = {}) {
  const { t } = useTranslation();
  const { user } = useUser();
  const isStaffView = patientId != null && patientId > 0;

  const {
    data: ownProfile,
    isLoading: ownLoading,
    error: ownError,
  } = useProfile({ enabled: !isStaffView });

  const {
    data: staffProfiles,
    isLoading: staffLoading,
    error: staffError,
  } = useUserProfiles(isStaffView ? patientId : 0);

  const data = isStaffView
    ? pickLatestUserProfile(staffProfiles)
    : ownProfile ?? null;

  const isLoading = isStaffView ? staffLoading : ownLoading;
  const error = isStaffView ? staffError : ownError;

  const patientName =
    patientNameProp ??
    (user
      ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.username
      : t("your", "Your"));

  const pageTitle = t("name_medical_profile", "{{name}} Medical Profile", {
    name: patientName,
  });

  const reportUserId = isStaffView ? patientId : user?.id;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-32 gap-4 lg:hidden">
          <div className="animate-spin text-blue-600 dark:text-blue-500">
            <LoaderIcon size={40} />
          </div>
          <p className="text-muted-foreground font-medium text-lg">
            {t("loading_profile")}
          </p>
        </div>
        <div className="hidden lg:block">
          <ProfileSkeleton />
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
            <AlertDescription>{t("error_loading_profile")}</AlertDescription>
          </Alert>
        </div>
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer scrollable>
        <div className="flex w-full flex-col gap-6">
          <Card className="relative overflow-hidden rounded-2xl border border-border shadow-sm">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-violet-500/5 dark:from-blue-500/10 dark:to-violet-500/5" />
            <CardContent className="relative p-6 sm:p-8">
              <HeroTitleRow pageTitle={pageTitle} />
            </CardContent>
          </Card>
          <Card className="max-w-2xl rounded-2xl border-dashed">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="rounded-2xl bg-muted p-4">
                <ClipboardList className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-lg">
                  {t("no_profile_title", "No medical profile yet")}
                </p>
                <p className="text-sm text-muted-foreground max-w-md">
                  {t(
                    "no_profile_desc",
                    "Your medical records have not been added yet. Contact your care team to set up your profile."
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    );
  }

  const comorbidityEntries = normalizeComorbidities(data.comorbidities);
  const medications = data.medications ?? [];
  const symptoms = data.symptoms ?? [];
  const allergies = data.allergies ?? [];
  const demographics = parseDemographics(data.demographics);

  const stats = [
    {
      label: t("comorbidities", "Conditions"),
      value: comorbidityEntries.length,
      icon: HeartPulse,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      label: t("allergies", "Allergies"),
      value: allergies.length,
      icon: ShieldAlert,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: t("medicine", "Medications"),
      value: medications.length,
      icon: Pill,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: t("symptoms", "Symptoms"),
      value: symptoms.length,
      icon: Activity,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
  ];

  const buildReport = () =>
    buildMedicalProfileReport(data, pageTitle, patientName, reportUserId);

  return (
    <PageContainer scrollable>
      <motion.div
        className="flex w-full flex-col gap-6"
        initial="initial"
        animate="animate"
        transition={{ staggerChildren: 0.06 }}
      >
        {backRoute && (
          <Link
            href={backRoute}
            className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            ← {t("back_to_patient", "Back to patient")}
          </Link>
        )}
        <motion.div variants={fadeUp}>
          <Card className="relative overflow-hidden rounded-2xl border border-border shadow-sm">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-violet-500/5 dark:from-blue-500/10 dark:to-violet-500/5" />
            <CardContent className="relative flex flex-col gap-5 p-6 sm:p-8">
              <HeroTitleRow
                pageTitle={pageTitle}
                ehrId={data.ehr_id}
                exportMenu={<MedicalProfileExportMenu buildReport={buildReport} />}
              />

              {data.timestamp && (
                <div className="flex items-center gap-2 w-fit rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
                  <Clock className="h-3.5 w-3.5" />
                  {t("last_updated", "Last updated")}:{" "}
                  <span className="font-medium text-foreground">
                    {new Date(data.timestamp).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-background/60 p-3 backdrop-blur-sm sm:p-4"
                    >
                      <div className={cn("rounded-xl p-2", stat.bg)}>
                        <Icon className={cn("h-4 w-4", stat.color)} />
                      </div>
                      <p className="ltr-nums text-xl font-bold sm:text-2xl">{stat.value}</p>
                      <p className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
                        {stat.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Demographics + Diagnosis */}
          <motion.div variants={fadeUp} className="flex flex-col gap-6 lg:col-span-2">
            <SectionShell
              icon={User}
              iconClass="text-blue-500"
              iconBg="bg-blue-500/10"
              title={t("demographics", "Demographics")}
              description={t("demographics_desc", "Patient background and identifiers")}
            >
              {!demographics ? (
                <p className="text-sm text-muted-foreground">{t("no_demographics")}</p>
              ) : demographics.raw ? (
                <p className="text-sm leading-relaxed text-foreground">{demographics.raw}</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {demographics.age != null && demographics.age !== "" && (
                    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("age", "Age")}
                      </p>
                      <p className="text-sm font-medium">{demographics.age}</p>
                    </div>
                  )}
                  {demographics.gender && (
                    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("gender", "Gender")}
                      </p>
                      <p className="text-sm font-medium capitalize">{demographics.gender}</p>
                    </div>
                  )}
                  {demographics.weight != null && demographics.weight !== "" && (
                    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("weight", "Weight")}
                      </p>
                      <p className="text-sm font-medium">{demographics.weight} kg</p>
                    </div>
                  )}
                  {demographics.height != null && demographics.height !== "" && (
                    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("height", "Height")}
                      </p>
                      <p className="text-sm font-medium">{demographics.height} cm</p>
                    </div>
                  )}
                </div>
              )}
            </SectionShell>

            <SectionShell
              icon={Stethoscope}
              iconClass="text-emerald-500"
              iconBg="bg-emerald-500/10"
              title={t("diagnosis", "Diagnosis")}
              description={t("diagnosis_desc", "Primary clinical diagnosis")}
            >
              {data.diagnosis ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                  <p className="text-sm font-medium leading-relaxed text-foreground">
                    {data.diagnosis}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("no_diagnosis", "No diagnosis recorded.")}
                </p>
              )}
            </SectionShell>

            <SectionShell
              icon={FileText}
              iconClass="text-amber-500"
              iconBg="bg-amber-500/10"
              title={t("physician_notes", "Physician Notes")}
              description={t("physician_notes_desc", "Notes from your care team")}
            >
              {data.physician_notes ? (
                <blockquote className="rounded-xl border-s-4 border-amber-500/40 bg-muted/40 px-4 py-3 text-sm leading-relaxed text-foreground italic">
                  {data.physician_notes}
                </blockquote>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("no_notes", "No notes available.")}
                </p>
              )}
            </SectionShell>
          </motion.div>

          {/* Comorbidities + Allergies sidebar */}
          <motion.div variants={fadeUp} className="flex flex-col gap-6">
            <SectionShell
              icon={HeartPulse}
              iconClass="text-rose-500"
              iconBg="bg-rose-500/10"
              title={t("comorbidities", "Comorbidities")}
              description={t("comorbidities_desc", "Existing conditions")}
              className="flex-1"
            >
              {comorbidityEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("no_comorbidities")}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {comorbidityEntries.map(([key, value]) => (
                    <Badge
                      key={`${key}-${value}`}
                      variant="secondary"
                      className="rounded-lg px-3 py-1.5 text-sm font-medium"
                    >
                      {value ? `${formatLabel(key)}: ${value}` : formatLabel(key)}
                    </Badge>
                  ))}
                </div>
              )}
            </SectionShell>

            <SectionShell
              icon={ShieldAlert}
              iconClass="text-amber-500"
              iconBg="bg-amber-500/10"
              title={t("allergies", "Allergies")}
              description={t(
                "allergies_desc",
                "Known allergies and intolerances"
              )}
            >
              <AllergiesEditor allergies={allergies} userId={reportUserId} />
            </SectionShell>
          </motion.div>
        </div>

        {/* Medications + Symptoms */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <motion.div variants={fadeUp} className="xl:col-span-3">
            <SectionShell
              icon={Pill}
              iconClass="text-blue-500"
              iconBg="bg-blue-500/10"
              title={t("medicine", "Medications")}
              description={t("medications_desc", "Active prescriptions and dosages")}
            >
              {medications.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("no_medications")}</p>
              ) : (
                <MedicationsList medications={medications} />
              )}
            </SectionShell>
          </motion.div>

          <motion.div variants={fadeUp} className="xl:col-span-2">
            <SectionShell
              icon={Activity}
              iconClass="text-violet-500"
              iconBg="bg-violet-500/10"
              title={t("symptoms", "Symptoms")}
              description={t("symptoms_desc", "Reported symptoms and severity")}
            >
              {symptoms.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("no_symptoms")}</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {symptoms.map((symptom) => (
                    <SymptomRow key={symptom.id} symptom={symptom} />
                  ))}
                </div>
              )}
            </SectionShell>
          </motion.div>
        </div>
      </motion.div>
    </PageContainer>
  );
};

export default function ProfileSection() {
  return <MedicalProfileView />;
}
