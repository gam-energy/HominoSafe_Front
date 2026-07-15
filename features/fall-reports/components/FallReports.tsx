'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Clock, X, ImageOff } from 'lucide-react';

import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { cn } from '@/lib/utils';
import {
  fetchFallReports,
  fetchFallReport,
  FallReportSummary,
} from '@/features/alert/api/alertApi';
import { usePatients } from '@/features/patients-list/api/useGetPatients';
import { useUser } from '@/context/UserContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function frameSrc(report: {
  frame_url?: string | null;
  frame_jpeg_b64?: string | null;
}): string | null {
  if (report.frame_url) return report.frame_url;
  if (report.frame_jpeg_b64) return `data:image/jpeg;base64,${report.frame_jpeg_b64}`;
  return null;
}

const ALL = 'all';

/** Simple lightbox — camera frame only, no alert actions. */
const FrameLightbox: React.FC<{
  visionDataId: number;
  onClose: () => void;
}> = ({ visionDataId, onClose }) => {
  const { t, i18n } = useTranslation();
  const [src, setSrc] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    patient_name?: string | null;
    patient_id: number;
    timestamp: string;
    confidence?: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchFallReport(visionDataId)
      .then((d) => {
        setSrc(frameSrc(d));
        setMeta({
          patient_name: d.patient_name,
          patient_id: d.patient_id,
          timestamp: d.timestamp,
          confidence: d.confidence,
        });
      })
      .catch(() => {
        setSrc(null);
        setMeta(null);
      })
      .finally(() => setLoading(false));
  }, [visionDataId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="py-24 text-center text-sm text-muted-foreground">
            {t('loading', 'Loading...')}
          </div>
        ) : (
          <>
            <div className="bg-black">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt="fall camera shot"
                  className="max-h-[70vh] w-full object-contain"
                />
              ) : (
                <div className="flex h-56 flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImageOff className="h-10 w-10 opacity-40" />
                  <p className="text-sm">{t('no_frame', 'No frame available.')}</p>
                </div>
              )}
            </div>
            {meta && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold">
                    {meta.patient_name ||
                      `${t('patient', 'Patient')} #${meta.patient_id}`}
                  </p>
                  <p className="text-xs text-muted-foreground ltr-nums">
                    {new Date(meta.timestamp).toLocaleString(i18n.language)}
                  </p>
                </div>
                {meta.confidence != null && (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold ltr-nums">
                    {Math.round(meta.confidence * 100)}%
                  </span>
                )}
              </div>
            )}
            <p className="border-t px-4 py-2 text-xs text-muted-foreground">
              {t(
                'fall_log_note',
                'Acknowledge and triage falls from the Alerts panel — this page is camera logs only.',
              )}
            </p>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

const FallCameraLogs: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const isStaff = user?.role === 'doctor' || user?.role === 'caregiver';

  const [reports, setReports] = useState<FallReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientFilter, setPatientFilter] = useState(ALL);
  const [selected, setSelected] = useState<number | null>(null);

  const { data: patients = [] } = usePatients(true, isStaff);

  useEffect(() => {
    setLoading(true);
    // Camera shots only — watch falls belong on the Alerts panel, not here.
    fetchFallReports({ limit: 100, source: 'vision_module' })
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let rows = reports.filter((r) => r.fall_detected !== false && frameSrc(r));
    // Include camera falls even without frame if none have frames yet
    if (rows.length === 0) {
      rows = reports.filter(
        (r) => r.source === 'vision_module' || !r.source?.includes('watch'),
      );
    }
    if (patientFilter !== ALL) {
      rows = rows.filter((r) => String(r.patient_id) === patientFilter);
    }
    return rows.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [reports, patientFilter]);

  return (
    <PageContainer scrollable>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Heading
          title={t('fall_camera_logs', 'Fall Camera Logs')}
          description={t(
            'fall_camera_logs_description',
            'Camera frames captured when a fall was detected. Triage and acknowledge falls from the Alerts panel.',
          )}
        />

        {isStaff && (
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-semibold">
              {t('filter_by_patient', 'Filter by patient')}
            </span>
            <Select value={patientFilter} onValueChange={setPatientFilter}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>
                  {t('all_patients', 'All patients')}
                </SelectItem>
                {patients.map((p) => {
                  const name =
                    [p.first_name, p.last_name].filter(Boolean).join(' ').trim() ||
                    p.username;
                  const count = reports.filter((r) => r.patient_id === p.id).length;
                  return (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {name} ({count})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            {t('loading', 'Loading...')}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
            <Camera className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {t('no_fall_camera_logs', 'No camera fall shots yet.')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => {
              const src = frameSrc(r);
              return (
                <motion.button
                  key={r.vision_data_id}
                  type="button"
                  layout
                  whileHover={{ y: -2 }}
                  onClick={() => setSelected(r.vision_data_id)}
                  className={cn(
                    'group overflow-hidden rounded-2xl border bg-card text-start shadow-sm transition hover:shadow-md',
                  )}
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
                        alt="fall camera shot"
                        className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageOff className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                      <Camera className="h-3 w-3" />
                      {t('camera', 'Camera')}
                    </span>
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="truncate text-sm font-bold">
                      {r.patient_name ||
                        `${t('patient', 'Patient')} #${r.patient_id}`}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="ltr-nums">
                        {new Date(r.timestamp).toLocaleString(i18n.language)}
                      </span>
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected != null && (
          <FrameLightbox visionDataId={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

export default FallCameraLogs;
