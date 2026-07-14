'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { cn } from '@/lib/utils';
import {
  Camera,
  Watch,
  AlertTriangle,
  Clock,
  X,
  ShieldCheck,
  Activity,
  History,
} from 'lucide-react';
import {
  fetchFallReports,
  fetchFallReport,
  actOnAlert,
  FallReportSummary,
  FallReportDetail,
} from '@/features/alert/api/alertApi';

const SOURCES: { id: string | 'all'; labelKey: string; label: string }[] = [
  { id: 'all', labelKey: 'all', label: 'All' },
  { id: 'vision_module', labelKey: 'camera', label: 'Camera' },
  { id: 'watch', labelKey: 'watch', label: 'Watch' },
];

function frameSrc(report: { frame_url?: string | null; frame_jpeg_b64?: string | null }): string | null {
  if (report.frame_url) return report.frame_url;
  if (report.frame_jpeg_b64) return `data:image/jpeg;base64,${report.frame_jpeg_b64}`;
  return null;
}

const SourceBadge: React.FC<{ source: string }> = ({ source }) => {
  const isWatch = source === 'watch';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white',
        isWatch ? 'bg-violet-500' : 'bg-sky-500'
      )}
    >
      {isWatch ? <Watch className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
      {isWatch ? 'Watch' : 'Camera'}
    </span>
  );
};

const MetadataOverlay: React.FC<{ metadata?: Record<string, unknown> | null }> = ({ metadata }) => {
  if (!metadata) return null;
  const entries = Object.entries(metadata);
  if (!entries.length) return null;
  return (
    <div className="absolute left-2 top-2 flex flex-col gap-1">
      {entries.map(([k, v]) => (
        <span
          key={k}
          className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm"
        >
          {k.replace(/_/g, ' ')}: {typeof v === 'number' ? (v as number).toFixed(2) : String(v)}
        </span>
      ))}
    </div>
  );
};

const FallDetailModal: React.FC<{
  visionDataId: number;
  onClose: () => void;
}> = ({ visionDataId, onClose }) => {
  const { t, i18n } = useTranslation();
  const [detail, setDetail] = useState<FallReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acking, setAcking] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchFallReport(visionDataId)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [visionDataId]);

  useEffect(() => {
    load();
  }, [load]);

  const src = detail ? frameSrc(detail) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            {t('loading', 'Loading...')}
          </div>
        ) : !detail ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            {t('fall_report_not_found', 'Fall report not found.')}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-rose-500" />
              <div>
                <h3 className="text-lg font-bold">
                  {detail.patient_name || `${t('patient', 'Patient')} #${detail.patient_id}`}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {new Date(detail.timestamp).toLocaleString(i18n.language)}
                </p>
              </div>
              <div className="ml-auto">
                <SourceBadge source={detail.source} />
              </div>
            </div>

            {/* Frame with metadata overlays */}
            <div className="relative overflow-hidden rounded-xl border bg-black/5">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="fall frame" className="max-h-[50vh] w-full object-contain" />
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                  {detail.source === 'watch'
                    ? t('no_frame_watch', 'No camera frame (watch accelerometer fall).')
                    : t('no_frame', 'No frame available.')}
                </div>
              )}
              <MetadataOverlay metadata={detail.metadata} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                  {t('confidence', 'Confidence')}
                </p>
                <p className="text-sm font-bold">
                  {detail.confidence != null ? `${Math.round(detail.confidence * 100)}%` : '—'}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                  {t('severity', 'Severity')}
                </p>
                <p className="text-sm font-bold capitalize">{detail.severity || '—'}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                  {t('status', 'Status')}
                </p>
                <p className="text-sm font-bold">{detail.status || '—'}</p>
              </div>
            </div>

            {/* Action history */}
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 border-b pb-2 text-sm font-bold">
                <History className="h-4 w-4 text-primary" />
                {t('action_history', 'Action History')}
              </h4>
              {detail.actions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t('no_actions_yet', 'No actions recorded yet.')}
                </p>
              ) : (
                <ul className="space-y-2">
                  {detail.actions.map((a) => (
                    <li key={a.id} className="flex items-start gap-2 text-xs">
                      <Activity className="mt-0.5 h-3.5 w-3.5 text-primary" />
                      <div>
                        <span className="font-semibold capitalize">{a.action}</span>
                        {a.notes ? ` — ${a.notes}` : ''}
                        <span className="ml-2 text-muted-foreground">
                          {new Date(a.timestamp).toLocaleString(i18n.language)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Acknowledge */}
            {detail.alert_id && detail.status === 'Active' && (
              <div className="flex justify-end">
                <button
                  disabled={acking}
                  onClick={async () => {
                    if (!detail.alert_id) return;
                    setAcking(true);
                    try {
                      await actOnAlert(detail.alert_id, 'acknowledge');
                      load();
                    } finally {
                      setAcking(false);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {acking ? t('acknowledging', 'Acknowledging...') : t('acknowledge', 'Acknowledge')}
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

const FallReports: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [reports, setReports] = useState<FallReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string | 'all'>('all');
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchFallReports({ limit: 100, source: source === 'all' ? undefined : source })
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [source]);

  const grouped = useMemo(() => reports, [reports]);

  return (
    <PageContainer scrollable>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <Heading
          title={t('fall_reports', 'Fall Reports')}
          description={t(
            'fall_reports_description',
            'Camera and watch fall detections with frames, detector overlays, and action history.'
          )}
        />

        <div className="flex gap-2">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSource(s.id)}
              className={cn(
                'rounded-xl border px-4 py-2 text-sm font-semibold transition',
                source === s.id
                  ? 'border-transparent bg-primary text-primary-foreground'
                  : 'border-border bg-card hover:bg-muted/50'
              )}
            >
              {t(s.labelKey, s.label)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            {t('loading', 'Loading...')}
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {t('no_fall_reports', 'No fall reports found.')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grouped.map((r) => {
              const src = frameSrc(r);
              return (
                <motion.button
                  key={r.vision_data_id}
                  layout
                  whileHover={{ y: -3 }}
                  onClick={() => setSelected(r.vision_data_id)}
                  className="group overflow-hidden rounded-2xl border bg-card text-start shadow-sm transition hover:shadow-md"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
                        alt="fall"
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Watch className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="absolute right-2 top-2">
                      <SourceBadge source={r.source} />
                    </div>
                    <MetadataOverlay metadata={undefined} />
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="truncate text-sm font-bold">
                      {r.patient_name || `${t('patient', 'Patient')} #${r.patient_id}`}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(r.timestamp).toLocaleString(i18n.language)}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-semibold capitalize text-muted-foreground">
                        {r.severity || t('fall', 'fall')}
                      </span>
                      <span className="text-xs font-bold">
                        {r.confidence != null ? `${Math.round(r.confidence * 100)}%` : ''}
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected != null && (
          <FallDetailModal visionDataId={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

export default FallReports;
