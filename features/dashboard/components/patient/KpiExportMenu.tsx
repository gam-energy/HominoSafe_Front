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
    summary,
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
    } catch {
      toast.error(t('report_export_failed', 'Failed to export report'));
    }
  };

  const handlePrintPdf = () => {
    try {
      printKpiReportAsPdf(buildPayload());
      toast.message(
        t('print_pdf_hint', 'Use “Save as PDF” in the print dialog')
      );
    } catch {
      toast.error(t('report_export_failed', 'Failed to export report'));
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
        <DropdownMenuItem onClick={handleDownloadHtml} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4" />
          {t('download_html', 'Download HTML')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrintPdf} className="gap-2 cursor-pointer">
          <Printer className="h-4 w-4" />
          {t('save_as_pdf', 'Save as PDF')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
