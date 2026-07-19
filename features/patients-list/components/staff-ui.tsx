"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  FileUp,
  Loader2,
  LucideIcon,
  MessageCircle,
  UserRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { User } from "@/features/dashboard/types/caregiver/user";

export const glassCard =
  "rounded-3xl border border-zinc-200/80 bg-white/70 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60";

export function StaffGlass({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(glassCard, className)}>{children}</div>;
}

export function StaffStatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  active,
  onClick,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  bg: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const Comp = onClick ? motion.button : motion.div;
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={cn(
        glassCard,
        "group relative flex w-full items-center gap-4 overflow-hidden p-4 text-start transition-all duration-300 hover:shadow-md sm:p-5",
        active && "border-primary/50 ring-1 ring-primary/30",
        onClick && "cursor-pointer"
      )}
    >
      <div className="absolute end-0 top-0 -z-10 h-16 w-16 rounded-bl-full bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className={cn("rounded-2xl p-3 shadow-sm", color, bg)}>
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.8} />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-2xl font-black tracking-tight text-transparent ltr-nums dark:from-zinc-100 dark:to-zinc-300 sm:text-3xl">
          {value}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
          {label}
        </span>
      </div>
    </Comp>
  );
}

export function StaffQuickAction({
  label,
  description,
  icon: Icon,
  onClick,
}: {
  label: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 rounded-2xl border border-zinc-200/70 bg-background/80 p-3.5 text-start transition-all duration-300 hover:border-primary/40 hover:shadow-sm dark:border-zinc-800/70"
    >
      <div className="rounded-xl bg-primary/10 p-2.5 text-primary transition-transform duration-300 group-hover:scale-110">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 rtl:-scale-x-100" />
    </button>
  );
}

function initials(patient: User) {
  const a = patient.first_name?.[0] || patient.username?.[0] || "?";
  const b = patient.last_name?.[0] || "";
  return `${a}${b}`.toUpperCase();
}

export function PatientCard({
  patient,
  onOpen,
  onMessage,
  onClinicalAgent,
  onImport,
  messaging,
  showImport,
}: {
  patient: User;
  onOpen: () => void;
  onMessage: () => void;
  onClinicalAgent?: () => void;
  onImport?: () => void;
  messaging?: boolean;
  showImport?: boolean;
}) {
  const { t } = useTranslation();
  const isActive = String(patient.status).toLowerCase() === "active";
  const incomplete = patient.records_complete === false;
  const name =
    `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
    patient.username;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      className={cn(
        glassCard,
        "group flex flex-col gap-4 p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-md"
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex items-start gap-3 text-start"
      >
        <div className="relative shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-black uppercase text-primary">
            {initials(patient)}
          </div>
          <span
            className={cn(
              "absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-background",
              isActive ? "bg-emerald-500" : "bg-amber-500"
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold tracking-tight">{name}</p>
          <p className="truncate text-xs text-muted-foreground">
            @{patient.username}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge
              variant="secondary"
              className={cn(
                "rounded-full text-[10px] font-semibold uppercase",
                isActive
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
              )}
            >
              {isActive
                ? t("active", "Active")
                : t("inactive", "Inactive")}
            </Badge>
            {incomplete && (
              <Badge
                variant="secondary"
                className="rounded-full bg-rose-500/10 text-[10px] font-semibold uppercase text-rose-700 dark:text-rose-300"
              >
                {t("records_incomplete", "Records incomplete")}
              </Badge>
            )}
            {!patient.caregiver_id && (
              <Badge
                variant="secondary"
                className="rounded-full bg-violet-500/10 text-[10px] font-semibold uppercase text-violet-700 dark:text-violet-300"
              >
                {t("no_caregiver", "No caregiver")}
              </Badge>
            )}
          </div>
        </div>
      </button>

      <div className="flex items-center gap-1.5 border-t border-border/60 pt-3">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 flex-1 rounded-full text-xs"
          onClick={onOpen}
        >
          <UserRound className="me-1.5 h-3.5 w-3.5" />
          {t("open", "Open")}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0 rounded-full"
          onClick={onMessage}
          disabled={messaging}
          title={t("message", "Message")}
        >
          {messaging ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageCircle className="h-4 w-4 text-primary" />
          )}
        </Button>
        {onClinicalAgent && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 rounded-full"
            onClick={onClinicalAgent}
            title={t("clinical_agent", "Clinical Agent")}
          >
            <Brain className="h-4 w-4 text-violet-600" />
          </Button>
        )}
        {showImport && onImport && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 rounded-full"
            onClick={onImport}
            title={t("import_records", "Import Records")}
          >
            <FileUp className="h-4 w-4 text-emerald-600" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export function StaffPanelSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="h-16 w-full max-w-md animate-pulse rounded-2xl bg-muted/50" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn(glassCard, "h-24 animate-pulse bg-muted/40")}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={cn(glassCard, "h-40 animate-pulse bg-muted/40")}
          />
        ))}
      </div>
    </div>
  );
}
