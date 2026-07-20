'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { User } from '@/features/dashboard/types/caregiver/user';

/** Shared surface — design tokens only (no zinc/emerald soup). */
export const staffSurface =
  'rounded-xl border border-border bg-card text-card-foreground shadow-sm';

export function StaffSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(staffSurface, className)}>{children}</div>;
}

/** @deprecated Prefer StaffSurface — kept as alias for existing imports. */
export const StaffGlass = StaffSurface;
export const glassCard = staffSurface;

export function StaffStatCard({
  label,
  value,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  /** Ignored — kept for call-site compat; tokens only. */
  color?: string;
  bg?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const Comp = onClick ? motion.button : motion.div;
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      whileHover={onClick ? { y: -1 } : undefined}
      className={cn(
        staffSurface,
        'flex w-full items-center gap-3 p-4 text-start transition-colors',
        onClick && 'cursor-pointer hover:bg-muted/40',
        active && 'border-primary ring-1 ring-primary/30',
      )}
    >
      <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold tracking-tight ltr-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
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
      className={cn(
        staffSurface,
        'group flex w-full items-center gap-3 p-3.5 text-start transition-colors hover:bg-muted/40',
      )}
    >
      <div className="rounded-lg bg-primary/10 p-2 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground rtl:-scale-x-100" />
    </button>
  );
}

function displayName(patient: User) {
  return (
    `${patient.first_name || ''} ${patient.last_name || ''}`.trim() ||
    patient.username
  );
}

function initials(patient: User) {
  const a = patient.first_name?.[0] || patient.username?.[0] || '?';
  const b = patient.last_name?.[0] || '';
  return `${a}${b}`.toUpperCase();
}

export type PatientCardStatus =
  | 'ok'
  | 'needs_attention'
  | 'incomplete'
  | 'unsettled'
  | 'inactive';

function statusCopy(
  status: PatientCardStatus,
  t: (k: string, d: string) => string,
): string {
  switch (status) {
    case 'unsettled':
      return t('status_unsettled', 'Needs check-in');
    case 'incomplete':
      return t('status_incomplete', 'Records incomplete');
    case 'needs_attention':
      return t('status_needs_attention', 'Needs attention');
    case 'inactive':
      return t('inactive', 'Inactive');
    default:
      return t('active', 'Active');
  }
}

/**
 * Patient as the interaction surface: avatar + name + one status line + one CTA.
 */
export function PatientCard({
  patient,
  onOpen,
  status,
  statusHint,
  ctaLabel,
  messaging,
}: {
  patient: User;
  onOpen: () => void;
  status?: PatientCardStatus;
  statusHint?: string;
  ctaLabel?: string;
  /** @deprecated secondary actions removed — kept for call-site compat */
  onMessage?: () => void;
  onClinicalAgent?: () => void;
  onImport?: () => void;
  messaging?: boolean;
  showImport?: boolean;
}) {
  const { t } = useTranslation();
  const isActive = String(patient.status).toLowerCase() === 'active';
  const resolved: PatientCardStatus =
    status ??
    (!isActive
      ? 'inactive'
      : patient.records_complete === false
        ? 'incomplete'
        : 'ok');
  const name = displayName(patient);
  const statusText = statusHint || statusCopy(resolved, t);
  const label = ctaLabel || t('open', 'Open');

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      disabled={messaging}
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={cn(
        staffSurface,
        'group flex w-full items-center gap-3 p-3.5 text-start transition-colors hover:border-primary/40 hover:bg-muted/30',
      )}
    >
      <div className="relative shrink-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold uppercase text-primary">
          {initials(patient)}
        </div>
        <span
          className={cn(
            'absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full border-2 border-card',
            resolved === 'ok' ? 'bg-primary' : 'bg-destructive',
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold tracking-tight">{name}</p>
        <p
          className={cn(
            'truncate text-xs',
            resolved === 'ok' ? 'text-muted-foreground' : 'text-destructive',
          )}
        >
          {statusText}
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground">
        {messaging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : label}
        {!messaging && (
          <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
        )}
      </span>
    </motion.button>
  );
}

export function StaffPanelSkeleton() {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded-md bg-muted/70" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
            <div className={cn(staffSurface, 'h-40 animate-pulse bg-muted/40')} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
