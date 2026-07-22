"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Search,
  ShieldAlert,
  UserCheck,
  UserX,
  Users,
  ClipboardList,
} from "lucide-react";

import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { usePatients } from "@/features/patients-list/api/useGetPatients";
import { useCreateRoom } from "@/features/chat/api/use-craete-room";
import { useUser } from "@/context/UserContext";
import { staffPatientRoutes, patientPublicRef } from "@/features/patient-knowledge/utils/staffRoutes";
import type { User } from "@/features/dashboard/types/caregiver/user";
import StaffCaseloadInsights from "./StaffCaseloadInsights";
import {
  PatientCard,
  StaffGlass,
  StaffPanelSkeleton,
  StaffStatCard,
} from "./staff-ui";

type Filter = "all" | "active" | "inactive" | "incomplete" | "uncovered";

type Props = {
  variant: "caregiver" | "doctor";
};

export default function StaffPatientsPanel({ variant }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useUser();
  const createRoom = useCreateRoom();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [messagingId, setMessagingId] = useState<number | null>(null);

  const { data: patients, isLoading, error } = usePatients(true);
  const isCaregiver = variant === "caregiver";

  const stats = useMemo(() => {
    const list = patients ?? [];
    return {
      total: list.length,
      active: list.filter((p) => p.status === "active").length,
      inactive: list.filter((p) => p.status === "inactive").length,
      incomplete: list.filter((p) => p.records_complete === false).length,
      uncovered: list.filter((p) => !p.caregiver_id).length,
    };
  }, [patients]);

  const filtered = useMemo(() => {
    let list = patients ?? [];
    switch (filter) {
      case "active":
        list = list.filter((p) => p.status === "active");
        break;
      case "inactive":
        list = list.filter((p) => p.status === "inactive");
        break;
      case "incomplete":
        list = list.filter((p) => p.records_complete === false);
        break;
      case "uncovered":
        list = list.filter((p) => !p.caregiver_id);
        break;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.username?.toLowerCase().includes(q) ||
          p.first_name?.toLowerCase().includes(q) ||
          p.last_name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [patients, filter, search]);

  const handleMessage = async (patient: User) => {
    setMessagingId(patient.id);
    try {
      const response = await createRoom.mutateAsync({
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

  if (error) {
    return (
      <PageContainer scrollable>
        <p className="text-rose-500">Error: {error.message}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <Heading
            title={
              isCaregiver
                ? t("my_household", "My Household")
                : t("patients", "Patients")
            }
            description={
              isCaregiver
                ? t(
                    "household_desc",
                    "People in your care — open a card to monitor vitals, records, and alerts."
                  )
                : t(
                    "patients_list_description",
                    "View, monitor and contact your patients."
                  )
            }
          />
          <div className="relative w-full max-w-sm">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search_patients", "Search patients...")}
              className="rounded-full ps-9"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <StaffGlass className="border-dashed p-12 text-center">
            <p className="text-sm text-muted-foreground">
              {t("no_patients_found", "No patients found.")}
            </p>
          </StaffGlass>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((patient) => {
              const routes = staffPatientRoutes(
                user?.role,
                patientPublicRef(patient),
              );
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

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StaffStatCard
            label={t("total_patients", "Total")}
            value={stats.total}
            icon={Users}
            color="text-blue-500"
            bg="bg-blue-500/10"
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <StaffStatCard
            label={t("active_patients", "Active")}
            value={stats.active}
            icon={UserCheck}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
            active={filter === "active"}
            onClick={() => setFilter("active")}
          />
          <StaffStatCard
            label={t("inactive_patients", "Inactive")}
            value={stats.inactive}
            icon={UserX}
            color="text-amber-500"
            bg="bg-amber-500/10"
            active={filter === "inactive"}
            onClick={() => setFilter("inactive")}
          />
          {isCaregiver ? (
            <StaffStatCard
              label={t("records_incomplete", "Incomplete")}
              value={stats.incomplete}
              icon={ClipboardList}
              color="text-rose-500"
              bg="bg-rose-500/10"
              active={filter === "incomplete"}
              onClick={() => setFilter("incomplete")}
            />
          ) : (
            <StaffStatCard
              label={t("uncovered_patients", "Uncovered")}
              value={stats.uncovered}
              icon={ShieldAlert}
              color="text-rose-500"
              bg="bg-rose-500/10"
              active={filter === "uncovered"}
              onClick={() => setFilter("uncovered")}
            />
          )}
        </div>

        {!isCaregiver && (
          <StaffCaseloadInsights patients={patients ?? []} />
        )}
      </div>
    </PageContainer>
  );
}
