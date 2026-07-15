'use client';

import { useTranslation } from 'react-i18next';
import { Download, FileText, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SummaryData } from '@/features/dashboard/types/patient/summery';
import type { RecommendData } from './RecommendSection';
import {
  downloadKpiReportHtml,
  printKpiReportAsPdf,
  type KpiReportPayload,
} from '@/features/dashboard/utils/exportKpiReport';

type KpiExportMenuProps = {
  summary: SummaryData;
  recommendations?: RecommendData | null;
  patientId: number;
  patientName?: string;
  activity?: string;
  disabled?: boolean;
};

export function KpiExportMenu({
  summary,
  recommendations,
  patientId,
  patientName,
  activity,
  disabled,
}: KpiExportMenuProps) {
  const { t } = useTranslation();

  const buildPayload = (): KpiReportPayload => ({
    summary: summary ?? {
      user_id: patientId,
      last_updated: new Date().toISOString(),
      kpis: {},
      recent_alerts: [],
      risk_assessments: [],
    },
    recommendations,
    meta: {
      patientId,
      patientName,
      activity,
      generatedAt: new Date().toISOString(),
    },
  });

  const handleDownloadHtml = () => {
    try {
      downloadKpiReportHtml(buildPayload());
      toast.success(t('report_downloaded', 'Report downloaded as HTML'));
    } catch (err) {
      console.error('KPI HTML export failed', err);
      toast.error(t('report_export_failed', 'Failed to export report'));
    }
  };

  const handlePrintPdf = () => {
    try {
      printKpiReportAsPdf(buildPayload());
      toast.message(
        t('print_pdf_hint', 'Use “Save as PDF” in the print dialog')
      );
    } catch (err) {
      console.error('KPI PDF export failed', err);
      // Fallback: still give the user a downloadable report.
      try {
        downloadKpiReportHtml(buildPayload());
        toast.message(
          t(
            'pdf_fallback_html',
            'Print was blocked — downloaded HTML instead. Open it and use Print → Save as PDF.'
          )
        );
      } catch (fallbackErr) {
        console.error('KPI export fallback failed', fallbackErr);
        toast.error(t('report_export_failed', 'Failed to export report'));
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-full text-xs"
          disabled={disabled}
        >
          <Download className="h-3.5 w-3.5" />
          {t('export_report', 'Export')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            handleDownloadHtml();
          }}
          className="cursor-pointer gap-2"
        >
          <FileText className="h-4 w-4" />
          {t('download_html', 'Download HTML')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            handlePrintPdf();
          }}
          className="cursor-pointer gap-2"
        >
          <Printer className="h-4 w-4" />
          {t('save_as_pdf', 'Save as PDF')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
