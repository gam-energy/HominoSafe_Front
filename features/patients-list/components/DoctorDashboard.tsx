"use client";
import React, { useMemo, useState } from "react";
import { DataTable } from "./table/data-table";
import { userColumns } from "./table/user-columns";
import { usePatients } from "../api/useGetPatients";
import { LoaderIcon } from "@/components/chat/icons";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { useTranslation } from "react-i18next";
import { Users, UserCheck, UserX, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import StaffCaseloadInsights from "./StaffCaseloadInsights";

type FilterOption = "all_users" | "active" | "inactive" | "non_covered";

const SummaryPill = ({
  label,
  value,
  icon: Icon,
  color,
  bg,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
  bg: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 rounded-2xl border bg-white/70 px-4 py-3 text-start shadow-sm transition-all duration-300 hover:shadow-md dark:bg-zinc-900/60 backdrop-blur-md",
      active
        ? "border-primary/60 ring-1 ring-primary/30"
        : "border-zinc-200/80 dark:border-zinc-800/80"
    )}
  >
    <div className={cn("p-2.5 rounded-xl", color, bg)}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex flex-col">
      <span className="text-xl font-black tracking-tight ltr-nums">{value}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  </button>
);

const DoctorDashboard = () => {
  const { t } = useTranslation();
  const [filterOption, setFilterOption] = useState<FilterOption>("all_users");

  const { data: patients, isLoading, error } = usePatients(true);

  const stats = useMemo(() => {
    const list = patients ?? [];
    return {
      total: list.length,
      active: list.filter((p) => p.status === "active").length,
      inactive: list.filter((p) => p.status === "inactive").length,
      uncovered: list.filter((p) => !p.caregiver_id).length,
    };
  }, [patients]);

  const filteredData = useMemo(() => {
    const list = patients ?? [];
    switch (filterOption) {
      case "active":
        return list.filter((p) => p.status === "active");
      case "inactive":
        return list.filter((p) => p.status === "inactive");
      case "non_covered":
        return list.filter((p) => !p.caregiver_id);
      default:
        return list;
    }
  }, [patients, filterOption]);

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin w-8 h-8 text-blue-500 mb-2 flex items-center justify-center">
            <LoaderIcon size={32} />
          </div>
          <span className="text-muted-foreground">
            {t("loading", "Loading patient list...")}
          </span>
        </div>
      </div>
    );

  if (error)
    return (
      <PageContainer scrollable>
        <p className="text-rose-500">Error: {error.message}</p>
      </PageContainer>
    );

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-col gap-6">
        <Heading
          title={t("patients", "Patients")}
          description={t(
            "patients_list_description",
            "View, monitor and contact your patients."
          )}
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryPill
            label={t("total_patients", "Total Patients")}
            value={stats.total}
            icon={Users}
            color="text-blue-500"
            bg="bg-blue-500/10"
            active={filterOption === "all_users"}
            onClick={() => setFilterOption("all_users")}
          />
          <SummaryPill
            label={t("active_patients", "Active")}
            value={stats.active}
            icon={UserCheck}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
            active={filterOption === "active"}
            onClick={() => setFilterOption("active")}
          />
          <SummaryPill
            label={t("inactive_patients", "Inactive")}
            value={stats.inactive}
            icon={UserX}
            color="text-amber-500"
            bg="bg-amber-500/10"
            active={filterOption === "inactive"}
            onClick={() => setFilterOption("inactive")}
          />
          <SummaryPill
            label={t("uncovered_patients", "Uncovered")}
            value={stats.uncovered}
            icon={ShieldAlert}
            color="text-rose-500"
            bg="bg-rose-500/10"
            active={filterOption === "non_covered"}
            onClick={() => setFilterOption("non_covered")}
          />
        </div>

        <StaffCaseloadInsights patients={patients ?? []} />

        <DataTable columns={userColumns} data={filteredData} />
      </div>
    </PageContainer>
  );
};

export default DoctorDashboard;
