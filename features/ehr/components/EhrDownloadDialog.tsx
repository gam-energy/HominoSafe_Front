'use client';

import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileDown, Loader2, FileJson, FileType } from 'lucide-react';
import {
  useExportEhr,
  downloadBlob,
  type EhrStandard,
} from '../api/use-ehr';

interface EhrDownloadDialogProps {
  patientId: number;
  trigger?: React.ReactNode;
}

const EhrDownloadDialog: FC<EhrDownloadDialogProps> = ({ patientId, trigger }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [standard, setStandard] = useState<EhrStandard | 'auto'>('auto');
  const exportEhr = useExportEhr();

  const handleDownload = async (format: 'json' | 'pdf') => {
    const std = standard === 'auto' ? undefined : standard;
    try {
      const result = await exportEhr.mutateAsync({ patientId, standard: std, format });
      if (format === 'pdf' && 'blob' in result) {
        downloadBlob(result.blob, result.filename);
      } else if (format === 'json' && 'json' in result) {
        const blob = new Blob([JSON.stringify(result.json.bundle, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `ehr-patient-${patientId}-${result.json.standard}.json`);
      }
    } catch (e) {
      console.error('EHR download failed', e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <FileDown className="me-2 h-4 w-4" />
            {t('download_ehr', 'Download medical record')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('ehr_record', 'Medical record')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t('ehr_standard', 'EHR standard')}</Label>
            <Select value={standard} onValueChange={(v) => setStandard(v as EhrStandard | 'auto')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">{t('auto', 'Auto (use clinic standard)')}</SelectItem>
                <SelectItem value="europe">{t('europe_standard', 'Europe (eHDSI IPS)')}</SelectItem>
                <SelectItem value="canada">{t('canada_standard', 'Canada (PS-CA)')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleDownload('json')}
              disabled={exportEhr.isPending}
            >
              {exportEhr.isPending ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <FileJson className="me-2 h-4 w-4" />
              )}
              {t('download_ehr_json', 'Download FHIR JSON')}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownload('pdf')}
              disabled={exportEhr.isPending}
            >
              {exportEhr.isPending ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <FileType className="me-2 h-4 w-4" />
              )}
              {t('download_ehr_pdf', 'Download PDF')}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t('close', 'Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EhrDownloadDialog;
