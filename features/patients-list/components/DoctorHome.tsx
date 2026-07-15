"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  UserX,
  Activity,
  MessageCircle,
  ArrowRight,
  Search,
  Stethoscope,
  Loader2,
  ShieldAlert,
  Brain,
  FileUp,
} from "lucide-react";

import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderIcon } from "@/components/chat/icons";

import { usePatients } from "@/features/patients-list/api/useGetPatients";
import { staffPatientRoutes } from "@/features/patient-knowledge/utils/staffRoutes";
import { useCreateRoom } from "@/features/chat/api/use-craete-room";
import { useUser } from "@/context/UserContext";
import { User } from "@/features/dashboard/types/caregiver/user";
import { cn } from "@/lib/utils";
import {
  AddPatientButton,
  InviteCaregiverButton,
} from "./CareTeamActions";

const StatCard = ({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: number | string;
  icon: any;
  color: string;
  bg: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm transition-all duration-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md"
  >
    <div className={cn("p-3 rounded-2xl", color, bg)}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="flex flex-col">
      <span className="text-2xl font-black tracking-tight ltr-nums">{value}</span>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  </motion.div>
);

const PatientRow = ({
  patient,
  onView,
  onMessage,
  onImport,
  onClinicalAgent,
  showImport,
  isMessaging,
}: {
  patient: User;
  onView: () => void;
  onMessage: () => void;
  onImport: () => void;
  onClinicalAgent: () => void;
  showImport: boolean;
  isMessaging: boolean;
}) => {
  const isActive = patient.status === "active";
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-200/70 bg-background p-3 transition-all duration-300 hover:shadow-sm hover:border-primary/30 dark:border-zinc-800/70">
      <div className="relative">
        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold uppercase">
          {patient.first_name?.[0] ?? patient.username?.[0] ?? "?"}
        </div>
        <span
          className={cn(
            "absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-background",
            isActive ? "bg-emerald-500" : "bg-amber-500"
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">
          {patient.first_name} {patient.last_name}
        </p>
        <p className="text-xs text-muted-foreground truncate">@{patient.username}</p>
      </div>
      <div className="flex items-center gap-1.5">
        {showImport && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-emerald-600"
            onClick={onImport}
            title="Import records"
          >
            <FileUp className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-violet-600"
          onClick={onClinicalAgent}
          title="Clinical agent"
        >
          <Brain className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary"
          onClick={onMessage}
          disabled={isMessaging}
          title="Message"
        >
          {isMessaging ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageCircle className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={onView}
          title="View profile"
        >
          <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
        </Button>
      </div>
    </div>
  );
};

export default function DoctorHome() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useUser();
  const createRoomMutation = useCreateRoom();
  const [search, setSearch] = useState("");
  const [messagingId, setMessagingId] = useState<number | null>(null);

  const { data: patients, isLoading, error } = usePatients(true);

  const isCaregiver = user?.role === "caregiver";
  const patientsListRoute = isCaregiver
    ? "/dashboard/my-patients"
    : "/dashboard/patients";
  const patientDetailBase = patientsListRoute;
  const alertsRoute = '/dashboard/patient-alert';

  const stats = useMemo(() => {
    const list = patients ?? [];
    const total = list.length;
    const active = list.filter((p) => p.status === "active").length;
    const inactive = list.filter((p) => p.status === "inactive").length;
    const uncovered = list.filter((p) => p.caregiver_id === 0).length;
    return { total, active, inactive, uncovered };
  }, [patients]);

  const filteredPatients = useMemo(() => {
    const list = patients ?? [];
    if (!search.trim()) return list.slice(0, 8);
    const q = search.toLowerCase();
    return list
      .filter(
        (p) =>
          p.username?.toLowerCase().includes(q) ||
          p.first_name?.toLowerCase().includes(q) ||
          p.last_name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [patients, search]);

  const handleMessage = async (patient: User) => {
    setMessagingId(patient.id);
    try {
      const response = await createRoomMutation.mutateAsync({
        target_username: patient.username,
        room_name: patient.username,
        topic: "General_discussion",
      });
      if (response?.room_id) {
        router.push(`/dashboard/chat/${response.room_id}`);
      }
    } catch (err) {
      console.error("Failed to start chat:", err);
    } finally {
      setMessagingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <span className="animate-spin w-10 h-10 text-blue-500 mb-4 flex items-center justify-center">
            <LoaderIcon size={40} />
          </span>
          <span className="text-lg text-muted-foreground">
            {t("loading", "Loading...")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Heading
            title={
              isCaregiver
                ? t("caregiver_dashboard", "Caregiver Dashboard")
                : t("doctor_dashboard", "Doctor Dashboard")
            }
            description={t("hi_welcome_back", {
              name: user?.first_name || (isCaregiver ? "Caregiver" : "Doctor"),
            })}
          />
          <div className="flex flex-wrap items-center gap-2">
            <InviteCaregiverButton />
            <AddPatientButton />
            <Button variant="outline" onClick={() => router.push("/dashboard/chat")}>
              <MessageCircle className="w-4 h-4 me-2" />
              {t("chat", "Chat")}
            </Button>
            <Button onClick={() => router.push(patientsListRoute)}>
              <Users className="w-4 h-4 me-2" />
              {t("all_patients", "All Patients")}
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("total_patients", "Total Patients")}
            value={stats.total}
            icon={Users}
            color="text-blue-500"
            bg="bg-blue-500/10"
          />
          <StatCard
            label={t("active_patients", "Active")}
            value={stats.active}
            icon={UserCheck}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
          />
          <StatCard
            label={t("inactive_patients", "Inactive")}
            value={stats.inactive}
            icon={UserX}
            color="text-amber-500"
            bg="bg-amber-500/10"
          />
          <StatCard
            label={t("uncovered_patients", "Uncovered")}
            value={stats.uncovered}
            icon={ShieldAlert}
            color="text-rose-500"
            bg="bg-rose-500/10"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Patients quick list */}
          <Card className="xl:col-span-8 flex flex-col gap-4 rounded-3xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold tracking-tight">
                  {t("my_patients", "My Patients")}
                </h3>
              </div>
              <div className="relative w-full max-w-xs">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("search_patients", "Search patients...")}
                  className="ps-9"
                />
              </div>
            </div>

            {error ? (
              <p className="text-sm text-rose-500 py-6 text-center">
                {error.message}
              </p>
            ) : filteredPatients.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center bg-muted/20 rounded-2xl border border-dashed">
                {t("no_patients_found", "No patients found.")}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {filteredPatients.map((patient) => (
                  <PatientRow
                    key={patient.id}
                    patient={patient}
                    isMessaging={messagingId === patient.id}
                    showImport
                    onView={() => router.push(`${patientDetailBase}/${patient.id}`)}
                    onImport={() =>
                      router.push(staffPatientRoutes(user?.role, patient.id).importRoute)
                    }
                    onClinicalAgent={() =>
                      router.push(
                        isCaregiver
                          ? `/dashboard/my-patients/${patient.id}/clinical-agent`
                          : `/dashboard/patients/${patient.id}/clinical-agent`
                      )
                    }
                    onMessage={() => handleMessage(patient)}
                  />
                ))}
              </div>
            )}

            <Button
              variant="ghost"
              className="self-center text-primary"
              onClick={() => router.push(patientsListRoute)}
            >
              {t("view_all_patients", "View all patients")}
              <ArrowRight className="w-4 h-4 ms-1 rtl:-scale-x-100" />
            </Button>
          </Card>

          {/* Quick actions / shortcuts */}
          <Card className="xl:col-span-4 flex flex-col gap-3 rounded-3xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold tracking-tight">
                {t("quick_actions", "Quick Actions")}
              </h3>
            </div>

            <QuickAction
              label={isCaregiver ? t("my_patients", "My Patients") : t("patients", "Patients")}
              description={t("manage_patient_records", "View and manage patient records")}
              icon={Users}
              onClick={() => router.push(patientsListRoute)}
            />
            <QuickAction
              label={t("patient_alerts", "Patient Alerts")}
              description={t("review_clinical_alerts", "Review clinical alerts")}
              icon={ShieldAlert}
              onClick={() => router.push(alertsRoute)}
            />
            <QuickAction
              label={t("ai_chat", "AI Chat")}
              description={t("ai_assistant_description", "Ask the AI health assistant")}
              icon={Brain}
              onClick={() => router.push("/dashboard/ai")}
            />
            <QuickAction
              label={t("chat", "Chat")}
              description={t("contact_patients", "Contact and message patients")}
              icon={MessageCircle}
              onClick={() => router.push("/dashboard/chat")}
            />
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

const QuickAction = ({
  label,
  description,
  icon: Icon,
  onClick,
}: {
  label: string;
  description: string;
  icon: any;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group flex items-center gap-3 rounded-2xl border border-zinc-200/70 bg-background p-3.5 text-start transition-all duration-300 hover:border-primary/40 hover:shadow-sm dark:border-zinc-800/70"
  >
    <div className="p-2.5 rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-sm">{label}</p>
      <p className="text-xs text-muted-foreground truncate">{description}</p>
    </div>
    <ArrowRight className="w-4 h-4 text-muted-foreground rtl:-scale-x-100 transition-transform duration-300 group-hover:translate-x-1" />
  </button>
);
