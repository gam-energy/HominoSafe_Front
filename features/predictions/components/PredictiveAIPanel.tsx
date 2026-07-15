'use client';

import React from 'react';
import { motion } from 'framer-motion';
import PageContainer from '@/components/layout/page-container';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/context/UserContext';
import { useCnnPredictions } from '@/features/predictions/api/useCnnPredictions';
import { CnnResultsCard } from '@/features/predictions/components/CnnResultsCard';
import { AgentAnalysisSection } from '@/features/predictions/components/AgentAnalysisSection';
import { Activity, BrainCircuit, Radio, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PredictiveAIPanel({ userId: userIdProp }: { userId?: number } = {}) {
  const { t } = useTranslation();
  const { user } = useUser();
  const userId = userIdProp ?? user?.id ?? 0;
  const { data, dataUpdatedAt } = useCnnPredictions(userId);

  const modelName = data?.model_name ?? 'SenioSentry BiLSTM-CNN';
  const modelVersion = data?.model_version ?? 'cnn-cardiac-v1';
  const lastWatchLabel = data?.last_watch_sample_at
    ? new Date(data.last_watch_sample_at).toLocaleString()
    : t('never', 'Never');
  const watchLive = !!data?.watch_connected;

  return (
    <PageContainer scrollable className="min-w-0">
      <div className="flex w-full min-w-0 max-w-full flex-col gap-8 overflow-x-hidden pb-8">
        {/* Showcase hero — brand-forward composition */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative isolate overflow-hidden rounded-[1.75rem] border border-border/70"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(120%_80%_at_10%_0%,hsl(186_72%_42%/0.18),transparent_55%),radial-gradient(90%_70%_at_90%_20%,hsl(221_83%_53%/0.14),transparent_50%),linear-gradient(160deg,hsl(210_40%_98%)_0%,hsl(204_55%_94%)_45%,hsl(210_35%_96%)_100%)] dark:bg-[radial-gradient(120%_80%_at_10%_0%,hsl(186_55%_35%/0.28),transparent_55%),radial-gradient(90%_70%_at_90%_20%,hsl(221_70%_45%/0.22),transparent_50%),linear-gradient(160deg,hsl(222_40%_8%)_0%,hsl(215_35%_12%)_100%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
            style={{
              backgroundImage:
                'linear-gradient(hsl(215_20%_50%/0.08) 1px, transparent 1px), linear-gradient(90deg, hsl(215_20%_50%/0.08) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              maskImage:
                'radial-gradient(ellipse 80% 70% at 50% 30%, black 20%, transparent 75%)',
            }}
          />
          {/* Soft pulse rings */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -end-16 -top-16 h-64 w-64 rounded-full border border-teal-500/20"
            animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.15, 0.35] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -end-8 top-8 h-44 w-44 rounded-full border border-primary/15"
            animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.12, 0.4] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          />

          <div className="relative z-10 flex flex-col gap-8 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <p className="font-[family-name:var(--font-instrument)] text-sm font-semibold tracking-[0.18em] text-teal-700 uppercase dark:text-teal-300">
                  SenioSentry
                </p>
                <h1 className="font-[family-name:var(--font-instrument)] text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl lg:leading-[1.1]">
                  {t('predictive_ai', 'Predictive AI')}
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {t(
                    'predictive_ai_hero',
                    'Live cardiac intelligence from your watch stream — window risk from the edge CNN, with scheduled clinical-agent reviews that surface what matters next.'
                  )}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                <div
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold',
                    watchLive
                      ? 'border-teal-500/30 bg-teal-500/10 text-teal-800 dark:text-teal-200'
                      : 'border-border bg-background/70 text-muted-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'h-2 w-2 rounded-sm',
                      watchLive ? 'animate-pulse bg-teal-500' : 'bg-muted-foreground/40'
                    )}
                  />
                  <Radio className="h-3.5 w-3.5" />
                  {watchLive
                    ? t('stream_live', 'Watch stream live')
                    : t('stream_waiting', 'Awaiting watch stream')}
                </div>
                {dataUpdatedAt ? (
                  <p className="text-[11px] text-muted-foreground ltr-nums">
                    {t('refreshed', 'Refreshed')}{' '}
                    {new Date(dataUpdatedAt).toLocaleTimeString()}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: BrainCircuit,
                  label: t('model', 'Model'),
                  value: modelName,
                  sub: modelVersion,
                },
                {
                  icon: Activity,
                  label: t('last_sample', 'Last wearable sample'),
                  value: lastWatchLabel,
                  sub: t('edge_inference', 'Edge inference @ 125 Hz'),
                },
                {
                  icon: Sparkles,
                  label: t('pipeline', 'Pipeline'),
                  value: t('dual_pipeline', 'CNN + clinical agent'),
                  sub: t('dual_pipeline_sub', 'Windows · 8h scheduled review'),
                },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                  className="rounded-2xl border border-border/60 bg-background/55 p-4 backdrop-blur-sm dark:bg-background/40"
                >
                  <div className="mb-2 flex items-center gap-2 text-teal-700 dark:text-teal-300">
                    <item.icon className="h-4 w-4" />
                    <span className="text-[11px] font-bold tracking-wider uppercase">
                      {item.label}
                    </span>
                  </div>
                  <p className="truncate text-sm font-semibold text-foreground">
                    {item.value}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {item.sub}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="grid gap-3 border-t border-border/50 pt-5 text-sm text-muted-foreground md:grid-cols-2">
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
                  'Predicted SBP/DBP, AF probability, RMSSD/SDNN, apnea risk, cardiac risk scores.'
                )}
              </p>
            </div>
          </div>
        </motion.section>

        {userId ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.45 }}
          >
            <CnnResultsCard userId={userId} />
          </motion.div>
        ) : null}

        {userId ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.45 }}
          >
            <AgentAnalysisSection patientId={userId} />
          </motion.div>
        ) : null}
      </div>
    </PageContainer>
  );
}
