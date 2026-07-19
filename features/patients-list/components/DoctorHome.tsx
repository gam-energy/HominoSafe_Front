"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CalendarDays,
  Camera,
  ClipboardList,
  HeartHandshake,
  MessageCircle,
  Search,
  ShieldAlert,
  Stethoscope,
  UserCheck,
  Users,
} from "lucide-react";

import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { usePatients } from "@/features/patients-list/api/useGetPatients";
import { staffPatientRoutes } from "@/features/patient-knowledge/utils/staffRoutes";
import { useCreateRoom } from "@/features/chat/api/use-craete-room";
import { useUser } from "@/context/UserContext";
import { fetchAlertHistory } from "@/features/alert/api/alertApi";
import type { User } from "@/features/dashboard/types/caregiver/user";
import {
  AddPatientButton,
  InviteCaregiverButton,
} from "./CareTeamActions";
import StaffCaseloadInsights from "./StaffCaseloadInsights";
import AppointmentsWidget from "@/features/appointments/components/AppointmentsWidget";
import {
  PatientCard,
  StaffGlass,
  StaffPanelSkeleton,
  StaffQuickAction,
  StaffStatCard,
} from "./staff-ui";

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
  const alertsRoute = "/dashboard/patient-alert";

  const patientIds = useMemo(
    () => new Set((patients ?? []).map((p) => p.id)),
    [patients]
  );

  const { data: alerts = [] } = useQuery({
    queryKey: ["staff-home-alerts"],
    queryFn: () => fetchAlertHistory({ limit: 80 }),
    staleTime: 60_000,
    enabled: isCaregiver,
  });

  const recentAlerts = useMemo(() => {
    return alerts
      .filter((a) => patientIds.size === 0 || patientIds.has(a.user_id))
      .slice(0, 5)
      .map((a) => {
        const p = (patients ?? []).find((x) => x.id === a.user_id);
        return {
          id: a.id ?? `${a.user_id}-${a.timestamp}`,
          severity: String(a.severity || "medium").toLowerCase(),
          message: a.message || a.alert_type || "Alert",
          when: a.timestamp,
          name: p
            ? `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.username
            : `#${a.user_id}`,
        };
      });
  }, [alerts, patientIds, patients]);

  const stats = useMemo(() => {
    const list = patients ?? [];
    return {
      total: list.length,
      active: list.filter((p) => p.status === "active").length,
      incomplete: list.filter((p) => p.records_complete === false).length,
      uncovered: list.filter((p) => !p.caregiver_id).length,
      openAlerts: recentAlerts.length,
    };
  }, [patients, recentAlerts.length]);

  const filteredPatients = useMemo(() => {
    const list = patients ?? [];
    if (!search.trim()) return list.slice(0, 6);
    const q = search.toLowerCase();
    return list
      .filter(
        (p) =>
          p.username?.toLowerCase().includes(q) ||
          p.first_name?.toLowerCase().includes(q) ||
          p.last_name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q)
      )
      .slice(0, 9);
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
    } finally {
      setMessagingId(null);
    }
  };

  if (isLoading) {
    return (
      <PageContainer scrollable>
        <StaffPanelSkeleton />
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-col gap-6">
        {/* Hero */}
        <StaffGlass className="relative overflow-hidden p-5 sm:p-6">
          <div className="pointer-events-none absolute -end-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -start-8 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {isCaregiver ? (
                  <HeartHandshake className="h-3.5 w-3.5" />
                ) : (
                  <Stethoscope className="h-3.5 w-3.5" />
                )}
                {isCaregiver
                  ? t("care_home", "Care home")
                  : t("clinic_floor", "Clinic floor")}
              </div>
              <Heading
                title={
                  isCaregiver
                    ? t("caregiver_dashboard", "Caregiver Dashboard")
                    : t("doctor_dashboard", "Doctor Dashboard")
                }
                description={t("hi_welcome_back", {
                  name:
                    user?.first_name ||
                    (isCaregiver ? "Caregiver" : "Doctor"),
                })}
              />
              <p className="max-w-xl text-sm text-muted-foreground">
                {isCaregiver
                  ? t(
                      "caregiver_home_blurb",
                      "Keep an eye on your household — open anyone to check vitals, records, and recent alerts."
                    )
                  : t(
                      "doctor_home_blurb",
                      "Your caseload at a glance — appointments, alerts, and patients who need follow-up."
                    )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!isCaregiver && <InviteCaregiverButton />}
              <AddPatientButton />
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => router.push("/dashboard/chat")}
              >
                <MessageCircle className="me-2 h-4 w-4" />
                {t("chat", "Chat")}
              </Button>
              <Button
                className="rounded-full"
                onClick={() => router.push(patientsListRoute)}
              >
                <Users className="me-2 h-4 w-4" />
                {isCaregiver
                  ? t("my_household", "My Household")
                  : t("all_patients", "All Patients")}
              </Button>
            </div>
          </div>
        </StaffGlass>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StaffStatCard
            label={t("total_patients", "Total Patients")}
            value={stats.total}
            icon={Users}
            color="text-blue-500"
            bg="bg-blue-500/10"
          />
          <StaffStatCard
            label={t("active_patients", "Active")}
            value={stats.active}
            icon={UserCheck}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
          />
          <StaffStatCard
            label={t("records_incomplete", "Incomplete")}
            value={stats.incomplete}
            icon={ClipboardList}
            color="text-amber-500"
            bg="bg-amber-500/10"
          />
          {isCaregiver ? (
            <StaffStatCard
              label={t("recent_alerts", "Recent alerts")}
              value={stats.openAlerts}
              icon={AlertTriangle}
              color="text-rose-500"
              bg="bg-rose-500/10"
              onClick={() => router.push(alertsRoute)}
            />
          ) : (
            <StaffStatCard
              label={t("uncovered_patients", "Uncovered")}
              value={stats.uncovered}
              icon={ShieldAlert}
              color="text-rose-500"
              bg="bg-rose-500/10"
            />
          )}
        </div>

        {!isCaregiver && <AppointmentsWidget />}
        {!isCaregiver && (
          <StaffCaseloadInsights patients={patients ?? []} />
        )}

        {/* Caregiver alert strip */}
        {isCaregiver && (
          <StaffGlass className="p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold tracking-tight">
                  {t("household_alerts", "Household alerts")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "household_alerts_desc",
                    "Latest signals from people in your care"
                  )}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => router.push(alertsRoute)}
              >
                {t("view_all", "View all")}
                <ArrowRight className="ms-1 h-3.5 w-3.5 rtl:-scale-x-100" />
              </Button>
            </div>
            {recentAlerts.length === 0 ? (
              <p className="rounded-2xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                {t("no_recent_alerts", "No recent alerts")}
              </p>
            ) : (
              <div className="space-y-2">
                {recentAlerts.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 px-3 py-2.5"
                  >
                    <Badge
                      variant="secondary"
                      className={`rounded-full text-[10px] uppercase ${
                        a.severity === "critical" || a.severity === "high"
                          ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {a.severity}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </StaffGlass>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <StaffGlass className="flex flex-col gap-4 p-5 xl:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {isCaregiver ? (
                  <HeartHandshake className="h-5 w-5 text-primary" />
                ) : (
                  <Stethoscope className="h-5 w-5 text-primary" />
                )}
                <h3 className="text-lg font-bold tracking-tight">
                  {isCaregiver
                    ? t("my_household", "My Household")
                    : t("my_patients", "My Patients")}
                </h3>
              </div>
              <div className="relative w-full max-w-xs">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("search_patients", "Search patients...")}
                  className="rounded-full ps-9"
                />
              </div>
            </div>

            {error ? (
              <p className="py-6 text-center text-sm text-rose-500">
                {error.message}
              </p>
            ) : filteredPatients.length === 0 ? (
              <p className="rounded-2xl border border-dashed bg-muted/20 py-10 text-center text-sm text-muted-foreground">
                {t("no_patients_found", "No patients found.")}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {filteredPatients.map((patient) => {
                  const routes = staffPatientRoutes(user?.role, patient.id);
                  return (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                      messaging={messagingId === patient.id}
                      showImport
                      onOpen={() => router.push(routes.detailRoute)}
                      onImport={() => router.push(routes.importRoute)}
                      onClinicalAgent={() =>
                        router.push(routes.clinicalAgentRoute)
                      }
                      onMessage={() => handleMessage(patient)}
                    />
                  );
                })}
              </div>
            )}

            <Button
              variant="ghost"
              className="self-center text-primary"
              onClick={() => router.push(patientsListRoute)}
            >
              {t("view_all_patients", "View all patients")}
              <ArrowRight className="ms-1 h-4 w-4 rtl:-scale-x-100" />
            </Button>
          </StaffGlass>

          <StaffGlass className="flex flex-col gap-3 p-5 xl:col-span-4">
            <div className="mb-1 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold tracking-tight">
                {t("quick_actions", "Quick Actions")}
              </h3>
            </div>

            <StaffQuickAction
              label={
                isCaregiver
                  ? t("my_household", "My Household")
                  : t("patients", "Patients")
              }
              description={t(
                "manage_patient_records",
                "View and manage patient records"
              )}
              icon={Users}
              onClick={() => router.push(patientsListRoute)}
            />
            <StaffQuickAction
              label={t("patient_alerts", "Patient Alerts")}
              description={t(
                "review_clinical_alerts",
                "Review clinical alerts"
              )}
              icon={ShieldAlert}
              onClick={() => router.push(alertsRoute)}
            />
            <StaffQuickAction
              label={t("appointments", "Appointments")}
              description={t(
                "manage_schedule",
                "Manage visits and availability"
              )}
              icon={CalendarDays}
              onClick={() => router.push("/dashboard/appointments")}
            />
            <StaffQuickAction
              label={t("fall_camera_logs", "Fall Camera Logs")}
              description={t(
                "review_fall_events",
                "Review fall detection events"
              )}
              icon={Camera}
              onClick={() => router.push("/dashboard/fall-reports")}
            />
            <StaffQuickAction
              label={t("ai_chat", "AI Chat")}
              description={t(
                "ai_assistant_description",
                "Ask the AI health assistant"
              )}
              icon={Brain}
              onClick={() => router.push("/dashboard/ai")}
            />
            <StaffQuickAction
              label={t("chat", "Chat")}
              description={t(
                "contact_patients",
                "Contact and message patients"
              )}
              icon={MessageCircle}
              onClick={() => router.push("/dashboard/chat")}
            />
          </StaffGlass>
        </div>
      </div>
    </PageContainer>
  );
}
