'use client';

import React, { useMemo } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/context/UserContext';
import { useCnnPredictions } from '@/features/predictions/api/useCnnPredictions';
import { cn } from '@/lib/utils';
import {
  Activity,
  Brain,
  HeartPulse,
  Gauge,
  Waves,
  Watch,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

function fmt2(value?: number | null, suffix = '') {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toFixed(2)}${suffix}`;
}

function fmt1(value?: number | null, suffix = '') {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toFixed(1)}${suffix}`;
}

function levelTone(level?: string | null) {
  const l = (level || '').toLowerCase();
  if (l.includes('critical') || l === 'high') {
    return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300';
  }
  if (l.includes('moderate') || l === 'medium') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
  }
  return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
}

function MetricTile({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/80 p-4">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="ltr-nums text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function PredictiveAIPanel({ userId: userIdProp }: { userId?: number } = {}) {
  const { t } = useTranslation();
  const { user } = useUser();
  const userId = userIdProp ?? user?.id ?? 0;
  const { data, isLoading, isError, error, dataUpdatedAt } = useCnnPredictions(userId);

  const window = data?.latest_window;
  const chartData = useMemo(() => {
    const rows = [...(data?.recent_windows ?? [])].reverse();
    return rows.map((w) => ({
      time: new Date(w.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      sbp: w.sbp_mmhg ?? null,
      dbp: w.dbp_mmhg ?? null,
      cardiac: w.cardiac_risk_score ?? null,
    }));
  }, [data?.recent_windows]);

  const lastWatchLabel = data?.last_watch_sample_at
    ? new Date(data.last_watch_sample_at).toLocaleString()
    : t('never', 'Never');

  return (
    <PageContainer scrollable>
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <Heading
            title={t('predictive_ai', 'Predictive AI')}
            description={t(
              'predictive_ai_desc',
              'CNN model predictions from your watch PPG/ECG stream'
            )}
          />
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold',
              data?.watch_connected
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <Watch className="h-3.5 w-3.5" />
            {data?.watch_connected
              ? t('watch_connected', 'Watch connected')
              : t('watch_offline', 'Watch offline')}
          </div>
        </div>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-muted p-2.5">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {data?.model_name ?? 'SenioSentry BiLSTM-CNN'}
                </CardTitle>
                <CardDescription className="mt-1 max-w-3xl">
                  {data?.description ??
                    t(
                      'cnn_model_blurb',
                      'The edge CNN scores short PPG/ECG windows to estimate blood pressure, atrial fibrillation probability, HRV, apnea risk, and overall cardiac risk.'
                    )}
                </CardDescription>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t('model_version', 'Model version')}:{' '}
                  <span className="font-medium text-foreground">
                    {data?.model_version ?? 'cnn-cardiac-v1'}
                  </span>
                  {dataUpdatedAt ? (
                    <>
                      {' · '}
                      {t('refreshed', 'Refreshed')}{' '}
                      {new Date(dataUpdatedAt).toLocaleTimeString()}
                    </>
                  ) : null}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
            <p>
              <span className="font-semibold text-foreground">
                {t('input', 'Input')}:{' '}
              </span>
              {t(
                'cnn_input',
                '10s PPG/ECG windows @ 125 Hz from the watch, plus age/sex/weight demographics.'
              )}
            </p>
            <p>
              <span className="font-semibold text-foreground">
                {t('output', 'Output')}:{' '}
              </span>
              {t(
                'cnn_output',
                'Predicted SBP/DBP, AF probability, RMSSD/SDNN, apnea probability, cardiac risk scores.'
              )}
            </p>
            <p>
              <span className="font-semibold text-foreground">
                {t('watch_link', 'Watch link')}:{' '}
              </span>
              {t('last_sample', 'Last wearable sample')}: {lastWatchLabel}
            </p>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex min-h-[220px] items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t('loading', 'Loading...')}
          </div>
        ) : isError ? (
          <Card className="border-destructive/40">
            <CardContent className="py-8 text-center text-sm text-destructive">
              {error?.message || t('failed_load_cnn', 'Failed to load CNN predictions.')}
            </CardContent>
          </Card>
        ) : !window ? (
          <Card>
            <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <Activity className="h-8 w-8 opacity-30" />
              <p>
                {t(
                  'no_cnn_windows',
                  'No CNN prediction windows yet. Waiting for watch PPG/ECG samples.'
                )}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold">
                {t('predicted_vitals', 'Predicted vitals')}
              </h3>
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold uppercase',
                  levelTone(window.cardiac_level)
                )}
              >
                {window.cardiac_level || 'n/a'} {t('cardiac_risk', 'cardiac risk')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricTile
                label={t('blood_pressure', 'Blood pressure')}
                value={
                  window.sbp_mmhg != null && window.dbp_mmhg != null
                    ? `${Math.round(window.sbp_mmhg)}/${Math.round(window.dbp_mmhg)}`
                    : '—'
                }
                hint="mmHg · CNN estimate"
                icon={Gauge}
              />
              <MetricTile
                label={t('af_probability', 'AF probability')}
                value={fmt2(
                  window.af_probability != null
                    ? window.af_probability * 100
                    : null,
                  '%'
                )}
                hint={t('from_ppg_ecg', 'From PPG/ECG window')}
                icon={HeartPulse}
              />
              <MetricTile
                label="RMSSD"
                value={fmt1(window.rmssd_ms, ' ms')}
                hint={t('hrv_metric', 'HRV metric')}
                icon={Waves}
              />
              <MetricTile
                label={t('apnea_probability', 'Apnea probability')}
                value={fmt2(
                  window.apnea_probability != null
                    ? window.apnea_probability * 100
                    : null,
                  '%'
                )}
                hint={t('sleep_breathing', 'Sleep breathing risk')}
                icon={ShieldAlert}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
              <Card className="lg:col-span-5">
                <CardHeader>
                  <CardTitle className="text-base">
                    {t('risk_scores', 'Risk scores')}
                  </CardTitle>
                  <CardDescription>
                    {t(
                      'risk_scores_desc',
                      '0–100 scores produced by the CNN for this window'
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Cardiac', value: window.cardiac_risk_score },
                    { label: 'AF', value: window.af_risk_score },
                    { label: 'Blood pressure', value: window.bp_risk_score },
                    { label: 'HRV', value: window.hrv_risk_score },
                    { label: 'Apnea', value: window.apnea_risk_score },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>{row.label}</span>
                        <span className="ltr-nums font-semibold">
                          {fmt1(row.value)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-foreground/70"
                          style={{
                            width: `${Math.max(0, Math.min(100, row.value ?? 0))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {window.summary ? (
                    <p className="pt-2 text-sm text-muted-foreground">{window.summary}</p>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="lg:col-span-7">
                <CardHeader>
                  <CardTitle className="text-base">
                    {t('recent_cnn_windows', 'Recent CNN windows')}
                  </CardTitle>
                  <CardDescription>
                    {t(
                      'recent_cnn_windows_desc',
                      'Predicted systolic/diastolic pressure and cardiac risk over recent windows'
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {chartData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="sbp"
                          name="SBP"
                          stroke="hsl(var(--foreground))"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="dbp"
                          name="DBP"
                          stroke="hsl(var(--muted-foreground))"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="cardiac"
                          name="Cardiac risk"
                          stroke="hsl(var(--destructive))"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      {t('no_history', 'No history yet')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {data?.latest_stroke ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t('stroke_risk_session', 'Session stroke risk')}
                  </CardTitle>
                  <CardDescription>
                    {t(
                      'stroke_risk_desc',
                      'Aggregated AF burden and CHA₂DS₂-VASc from the CNN session summary'
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <MetricTile
                    label={t('stroke_score', 'Stroke score')}
                    value={fmt1(data.latest_stroke.stroke_risk_score)}
                    icon={ShieldAlert}
                  />
                  <MetricTile
                    label="CHA₂DS₂-VASc"
                    value={String(data.latest_stroke.cha2ds2_vasc_score ?? '—')}
                    icon={Activity}
                  />
                  <MetricTile
                    label={t('af_burden', 'AF burden')}
                    value={fmt2(
                      data.latest_stroke.af_burden != null
                        ? data.latest_stroke.af_burden * 100
                        : null,
                      '%'
                    )}
                    icon={HeartPulse}
                  />
                </CardContent>
              </Card>
            ) : null}
          </>
        )}
      </div>
    </PageContainer>
  );
}
