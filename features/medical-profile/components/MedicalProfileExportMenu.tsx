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
import {
  downloadMedicalProfileReport,
  printMedicalProfileReportAsPdf,
  type MedicalProfileReportData,
} from '@/features/medical-profile/utils/exportMedicalProfileReport';

export function MedicalProfileExportMenu({
  buildReport,
}: {
  buildReport: () => MedicalProfileReportData;
}) {
  const { t } = useTranslation();

  const handleDownloadHtml = () => {
    try {
      downloadMedicalProfileReport(buildReport());
      toast.success(t('report_downloaded', 'Report downloaded as HTML'));
    } catch {
      toast.error(t('export_failed', 'Failed to export report'));
    }
  };

  const handlePrintPdf = () => {
    try {
      printMedicalProfileReportAsPdf(buildReport());
      toast.message(
        t('print_pdf_hint', 'Use “Save as PDF” in the print dialog')
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('export_failed', 'Failed to export report')
      );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full bg-background/80 backdrop-blur-sm">
          <Download className="h-3.5 w-3.5" />
          {t('export_report', 'Export')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
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
