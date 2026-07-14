'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  Brain,
  FileHeart,
  FileUp,
  Gauge,
  LayoutDashboard,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { CopyButton } from '@/components/ui/copy-button';
import { staffPatientRoutes } from '@/features/patient-knowledge/utils/staffRoutes';

export function StaffPatientNav({
  role,
  patientId,
}: {
  role: string | undefined;
  patientId: number;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const routes = staffPatientRoutes(role, patientId);

  const items = [
    {
      href: routes.detailRoute,
      label: t('overview', 'Overview'),
      icon: LayoutDashboard,
    },
    {
      href: routes.medicalProfileRoute,
      label: t('medical_profile', 'Medical Profile'),
      icon: FileHeart,
    },
    {
      href: routes.healthKpisRoute,
      label: t('health_kpis', 'Health KPIs'),
      icon: Gauge,
    },
    {
      href: routes.clinicalAgentRoute,
      label: t('clinical_agent', 'Clinical Agent'),
      icon: Brain,
    },
    {
      href: routes.importRoute,
      label: t('import_records', 'Import Records'),
      icon: FileUp,
    },
  ];

  return (
    <nav className="flex flex-wrap gap-2 rounded-2xl border border-border bg-muted/30 p-2">
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href ||
          (href !== routes.detailRoute && pathname.startsWith(href));

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
      <div className="ms-auto hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
        <Activity className="h-3.5 w-3.5" />
        {t('patient_id', 'Patient ID')}: {patientId}
        <CopyButton
          content={String(patientId)}
          copyMessage={t('copied', 'Copied to clipboard')}
        />
      </div>
    </nav>
  );
}
