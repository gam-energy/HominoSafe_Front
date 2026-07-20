'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock3,
  ImageOff,
  LayoutGrid,
  LayoutList,
  Radio,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';

import PageContainer from '@/components/layout/page-container';
import { AuthImage } from '@/components/auth-image';
import { FallFrameImage, bboxFromMetadata } from '@/components/fall-frame-image';
import { Heading } from '@/components/ui/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  fetchFallReport,
  fetchFallReports,
  FallReportDetail,
  FallReportSummary,
} from '@/features/alert/api/alertApi';
import { usePatients } from '@/features/patients-list/api/useGetPatients';
import { useUser } from '@/context/UserContext';

const ALL = 'all';
type SourceFilter = 'all' | 'vision_module' | 'watch';
type ViewMode = 'gallery' | 'list';

function frameSrc(report: {
  frame_url?: string | null;
  frame_jpeg_b64?: string | null;
}) {
  if (report.frame_url) return report.frame_url;
  if (report.frame_jpeg_b64) {
    return `data:image/jpeg;base64,${report.frame_jpeg_b64}`;
  }
  return null;
}

function isWatchSource(source: string) {
  const s = (source || '').toLowerCase();
  return s === 'watch' || s.includes('watch');
}

function sourceLabel(source: string) {
  return isWatchSource(source) ? 'Watch' : 'Camera';
}

function metadataNumber(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
) {
  const value = metadata?.[key];
  return typeof value === 'number' ? value : null;
}

function FallDetail({
  id,
  onClose,
}: {
  id: number;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [detail, setDetail] = useState<FallReportDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchFallReport(id)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [id]);

  const src = detail ? frameSrc(detail) : null;
  const isWatch = isWatchSource(detail?.source || '');
  const analysis =
    typeof detail?.metadata?.analysis === 'string'
      ? detail.metadata.analysis
      : isWatch
        ? t(
            'watch_fall_analysis',
            'Watch motion sensors detected a fall signature from acceleration and rotation.',
          )
        : t(
            'camera_fall_analysis',
            'The vision detector classified a person in a floor-level posture.',
          );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, scale: 0.97, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 20, scale: 0.97, opacity: 0 }}
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={onClose}
          className="absolute end-3 top-3 z-10 h-9 w-9 rounded-full bg-black/55 text-white hover:bg-black/75"
        >
          <X className="h-4 w-4" />
        </Button>

        {loading ? (
          <div className="py-28 text-center text-sm text-muted-foreground">
            {t('loading', 'Loading...')}
          </div>
        ) : !detail ? (
          <div className="py-28 text-center text-sm text-muted-foreground">
            {t('failed_load_fall_event', 'Failed to load fall event.')}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5">
            <div className="flex min-h-72 items-center justify-center overflow-hidden bg-zinc-950 lg:col-span-3">
              {src ? (
                <FallFrameImage
                  url={src}
                  alt={t('fall_event_frame', 'Fall event frame')}
                  className="max-h-[74vh] w-full"
                  bbox={bboxFromMetadata(detail.metadata)}
                  confidence={detail.confidence}
                  fallback={
                    <div className="flex flex-col items-center gap-4 p-12 text-center text-zinc-400">
                      <ImageOff className="h-16 w-16" />
                      <p className="text-sm">{t('no_frame', 'No frame available.')}</p>
                    </div>
                  }
                />
              ) : (
                <div className="flex flex-col items-center gap-4 p-12 text-center text-zinc-400">
                  {isWatch ? (
                    <Smartphone className="h-16 w-16 text-violet-400" />
                  ) : (
                    <ImageOff className="h-16 w-16" />
                  )}
                  <p className="text-sm">
                    {isWatch
                      ? t(
                          'watch_event_no_image',
                          'Watch events use motion sensors and do not include a camera image.',
                        )
                      : t('no_frame', 'No frame available.')}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-5 p-5 lg:col-span-2 lg:p-6">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge
                    className={cn(
                      'rounded-full',
                      isWatch
                        ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300'
                        : 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
                    )}
                  >
                    {isWatch ? (
                      <Smartphone className="me-1 h-3 w-3" />
                    ) : (
                      <Camera className="me-1 h-3 w-3" />
                    )}
                    {t(
                      isWatch ? 'watch' : 'camera',
                      sourceLabel(detail.source),
                    )}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full border-rose-500/30 text-rose-600"
                  >
                    {t('fall_detected', 'Fall detected')}
                  </Badge>
                </div>
                <h2 className="text-xl font-black tracking-tight">
                  {detail.patient_name ||
                    `${t('patient', 'Patient')} #${detail.patient_id}`}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground ltr-nums">
                  {new Date(detail.timestamp).toLocaleString(i18n.language)}
                </p>
              </div>

              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                  <Activity className="h-4 w-4 text-primary" />
                  {t('device_analysis', 'Device analysis')}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {analysis}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Metric
                  label={t('confidence', 'Confidence')}
                  value={
                    detail.confidence != null
                      ? `${Math.round(detail.confidence * 100)}%`
                      : '—'
                  }
                />
                <Metric
                  label={t('posture', 'Posture')}
                  value={detail.posture || '—'}
                />
                {isWatch ? (
                  <>
                    <Metric
                      label={t('peak_acceleration', 'Peak acceleration')}
                      value={
                        metadataNumber(detail.metadata, 'peak_accel_g') != null
                          ? `${metadataNumber(detail.metadata, 'peak_accel_g')} g`
                          : '—'
                      }
                    />
                    <Metric
                      label={t('peak_rotation', 'Peak rotation')}
                      value={
                        metadataNumber(
                          detail.metadata,
                          'peak_gyro_rad_s',
                        ) != null
                          ? `${metadataNumber(
                              detail.metadata,
                              'peak_gyro_rad_s',
                            )} rad/s`
                          : '—'
                      }
                    />
                  </>
                ) : (
                  <>
                    <Metric
                      label={t('body_angle', 'Body angle')}
                      value={
                        metadataNumber(detail.metadata, 'body_angle_deg') != null
                          ? `${metadataNumber(
                              detail.metadata,
                              'body_angle_deg',
                            )}°`
                          : '—'
                      }
                    />
                    <Metric
                      label={t('stillness', 'Stillness')}
                      value={
                        metadataNumber(
                          detail.metadata,
                          'stillness_duration_s',
                        ) != null
                          ? `${metadataNumber(
                              detail.metadata,
                              'stillness_duration_s',
                            )} s`
                          : '—'
                      }
                    />
                  </>
                )}
              </div>

              <div className="flex items-center justify-between rounded-2xl border px-3 py-2.5 text-sm">
                <span className="text-muted-foreground">
                  {t('alert_status', 'Alert status')}
                </span>
                <Badge
                  variant="secondary"
                  className={cn(
                    'rounded-full capitalize',
                    detail.status?.toLowerCase() === 'resolved'
                      ? 'bg-emerald-500/10 text-emerald-700'
                      : 'bg-amber-500/10 text-amber-700',
                  )}
                >
                  {detail.status || t('recorded', 'Recorded')}
                </Badge>
              </div>

              {detail.device_id && (
                <p className="text-[11px] text-muted-foreground">
                  {t('device', 'Device')}: <code>{detail.device_id}</code>
                </p>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/25 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold capitalize ltr-nums">{value}</p>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
  className,
}: {
  icon: typeof Camera;
  value: number;
  label: string;
  className: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60">
      <div className={cn('mb-3 w-fit rounded-xl p-2.5', className)}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-black tracking-tight ltr-nums">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export default function FallReports() {
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const isStaff =
    user?.role === 'doctor' ||
    user?.role === 'caregiver' ||
    user?.role === 'clinic_admin' ||
    user?.role === 'admin';

  const [reports, setReports] = useState<FallReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<SourceFilter>('all');
  const [patient, setPatient] = useState(ALL);
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [selected, setSelected] = useState<number | null>(null);
  const { data: patients = [] } = usePatients(true, isStaff);

  useEffect(() => {
    setLoading(true);
    fetchFallReports({ limit: 200 })
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      reports.filter(
        (report) =>
          (source === 'all' ||
            (source === 'watch'
              ? isWatchSource(report.source)
              : !isWatchSource(report.source))) &&
          (patient === ALL || String(report.patient_id) === patient),
      ),
    [reports, source, patient],
  );

  const cameraCount = reports.filter(
    (report) => !isWatchSource(report.source),
  ).length;
  const watchCount = reports.filter((report) =>
    isWatchSource(report.source),
  ).length;
  const openCount = reports.filter(
    (report) =>
      !report.status ||
      ['active', 'open', 'acknowledged'].includes(
        String(report.status).toLowerCase(),
      ),
  ).length;

  return (
    <PageContainer scrollable>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60 sm:p-6">
          <div className="pointer-events-none absolute -end-12 -top-16 h-48 w-48 rounded-full bg-rose-500/10 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-600">
                <Radio className="h-3.5 w-3.5" />
                {t('safety_event_log', 'Safety event log')}
              </div>
              <Heading
                title={t('fall_reports', 'Fall Reports')}
                description={t(
                  'fall_reports_description',
                  'Camera and smartwatch fall detections in one timeline, with device analysis and evidence.',
                )}
              />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border bg-background/70 px-3 py-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              {isStaff
                ? t('care_team_view', 'Care team view')
                : t('your_events_only', 'Only your events')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            icon={AlertTriangle}
            value={reports.length}
            label={t('all_falls', 'All falls')}
            className="bg-rose-500/10 text-rose-500"
          />
          <Stat
            icon={Camera}
            value={cameraCount}
            label={t('camera_events', 'Camera events')}
            className="bg-sky-500/10 text-sky-500"
          />
          <Stat
            icon={Smartphone}
            value={watchCount}
            label={t('watch_events', 'Watch events')}
            className="bg-violet-500/10 text-violet-500"
          />
          <Stat
            icon={CheckCircle2}
            value={openCount}
            label={t('needs_review', 'Needs review')}
            className="bg-amber-500/10 text-amber-500"
          />
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white/70 p-3 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full gap-1 rounded-full bg-muted p-1 sm:w-auto">
            {(
              [
                ['all', t('all', 'All'), Activity],
                ['vision_module', t('camera', 'Camera'), Camera],
                ['watch', t('watch', 'Watch'), Smartphone],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSource(value)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition sm:flex-none',
                  source === value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="flex rounded-full bg-muted p-1">
              <button
                type="button"
                onClick={() => setViewMode('gallery')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  viewMode === 'gallery'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                {t('gallery_view', 'Gallery')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  viewMode === 'list'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <LayoutList className="h-3.5 w-3.5" />
                {t('list_view', 'List')}
              </button>
            </div>

            {isStaff && (
              <Select value={patient} onValueChange={setPatient}>
                <SelectTrigger className="w-full rounded-full sm:w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>
                    {t('all_patients', 'All patients')}
                  </SelectItem>
                  {patients.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {[item.first_name, item.last_name]
                        .filter(Boolean)
                        .join(' ')
                        .trim() || item.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {loading ? (
          <div
            className={cn(
              viewMode === 'list'
                ? 'space-y-2'
                : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
            )}
          >
            {Array.from({ length: viewMode === 'list' ? 8 : 6 }).map(
              (_, index) => (
                <div
                  key={index}
                  className={cn(
                    'animate-pulse rounded-3xl border bg-muted/40',
                    viewMode === 'list' ? 'h-16' : 'h-64',
                  )}
                />
              ),
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed py-16 text-center">
            <ShieldCheck className="h-11 w-11 text-emerald-500/60" />
            <p className="font-semibold">
              {t('no_fall_events', 'No fall events found.')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t(
                'no_fall_events_desc',
                'Camera and watch detections will appear here automatically.',
              )}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/70 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/60">
            <div className="hidden grid-cols-[minmax(0,1.4fr)_auto_minmax(0,1fr)_auto_auto] gap-3 border-b px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
              <span>{t('patient', 'Patient')}</span>
              <span>{t('source', 'Source')}</span>
              <span>{t('recorded', 'Recorded')}</span>
              <span>{t('confidence', 'Confidence')}</span>
              <span>{t('alert_status', 'Alert status')}</span>
            </div>
            <div className="divide-y">
              {filtered.map((report) => {
                const isWatch = isWatchSource(report.source);
                return (
                  <button
                    key={report.vision_data_id}
                    type="button"
                    onClick={() => setSelected(report.vision_data_id)}
                    className="grid w-full grid-cols-1 gap-2 px-4 py-3 text-start transition hover:bg-muted/40 sm:grid-cols-[minmax(0,1.4fr)_auto_minmax(0,1fr)_auto_auto] sm:items-center sm:gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        {report.patient_name ||
                          `${t('patient', 'Patient')} #${report.patient_id}`}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground capitalize">
                        {t('posture', 'Posture')}: {report.posture || '—'}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        'w-fit rounded-full border-0',
                        isWatch
                          ? 'bg-violet-600/85 text-white'
                          : 'bg-sky-600/85 text-white',
                      )}
                    >
                      {isWatch ? (
                        <Smartphone className="me-1 h-3 w-3" />
                      ) : (
                        <Camera className="me-1 h-3 w-3" />
                      )}
                      {t(
                        isWatch ? 'watch' : 'camera',
                        sourceLabel(report.source),
                      )}
                    </Badge>
                    <span className="text-xs text-muted-foreground ltr-nums">
                      {new Date(report.timestamp).toLocaleString(i18n.language)}
                    </span>
                    <span className="text-xs font-semibold ltr-nums">
                      {report.confidence != null
                        ? `${Math.round(report.confidence * 100)}%`
                        : '—'}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'w-fit rounded-full capitalize',
                        String(report.status || '').toLowerCase() === 'resolved'
                          ? 'bg-emerald-500/10 text-emerald-700'
                          : 'bg-amber-500/10 text-amber-700',
                      )}
                    >
                      {report.status || t('recorded', 'Recorded')}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((report) => {
              const isWatch = isWatchSource(report.source);
              const src = frameSrc(report);
              const analysis =
                typeof report.metadata?.analysis === 'string'
                  ? report.metadata.analysis
                  : isWatch
                    ? t('watch_motion_analysis', 'Motion signature analyzed')
                    : t('vision_posture_analysis', 'Floor posture analyzed');
              return (
                <motion.button
                  key={report.vision_data_id}
                  type="button"
                  layout
                  whileHover={{ y: -3 }}
                  onClick={() => setSelected(report.vision_data_id)}
                  className="group overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/70 text-start shadow-sm backdrop-blur-md transition hover:border-primary/30 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/60"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-zinc-950">
                    {src ? (
                      <AuthImage
                        url={src}
                        alt={t('fall_event_frame', 'Fall event frame')}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        fallback={
                          <div className="flex h-full items-center justify-center text-zinc-500">
                            <ImageOff className="h-10 w-10" />
                          </div>
                        }
                      />
                    ) : (
                      <div
                        className={cn(
                          'flex h-full flex-col items-center justify-center gap-2',
                          isWatch
                            ? 'bg-gradient-to-br from-violet-950 to-zinc-950 text-violet-300'
                            : 'text-zinc-500',
                        )}
                      >
                        {isWatch ? (
                          <>
                            <Smartphone className="h-11 w-11" />
                            <div className="flex items-end gap-1 opacity-60">
                              {[2, 5, 3, 8, 4, 7, 2].map((height, index) => (
                                <span
                                  key={index}
                                  className="w-1 rounded-full bg-current"
                                  style={{ height: `${height * 3}px` }}
                                />
                              ))}
                            </div>
                          </>
                        ) : (
                          <ImageOff className="h-10 w-10" />
                        )}
                      </div>
                    )}
                    <Badge
                      className={cn(
                        'absolute start-2 top-2 rounded-full border-0 backdrop-blur',
                        isWatch
                          ? 'bg-violet-600/85 text-white'
                          : 'bg-sky-600/85 text-white',
                      )}
                    >
                      {isWatch ? (
                        <Smartphone className="me-1 h-3 w-3" />
                      ) : (
                        <Camera className="me-1 h-3 w-3" />
                      )}
                      {t(
                        isWatch ? 'watch' : 'camera',
                        sourceLabel(report.source),
                      )}
                    </Badge>
                    {report.confidence != null && (
                      <span className="absolute end-2 top-2 rounded-full bg-black/65 px-2 py-1 text-[10px] font-bold text-white ltr-nums">
                        {Math.round(report.confidence * 100)}%
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {report.patient_name ||
                            `${t('patient', 'Patient')} #${report.patient_id}`}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5" />
                          <span className="ltr-nums">
                            {new Date(report.timestamp).toLocaleString(
                              i18n.language,
                            )}
                          </span>
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-rose-500/10 text-[10px] text-rose-700 dark:text-rose-300"
                      >
                        {t('fall', 'Fall')}
                      </Badge>
                    </div>
                    <div className="rounded-xl bg-muted/35 px-3 py-2">
                      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {analysis}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="capitalize">
                        {t('posture', 'Posture')}: {report.posture || '—'}
                      </span>
                      <span className="capitalize">
                        {report.status || t('recorded', 'Recorded')}
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
          <FallDetail id={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
