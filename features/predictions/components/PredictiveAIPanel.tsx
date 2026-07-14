'use client';

import React from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/context/UserContext';
import { useCnnPredictions } from '@/features/predictions/api/useCnnPredictions';
import { CnnResultsCard } from '@/features/predictions/components/CnnResultsCard';
import { AgentAnalysisSection } from '@/features/predictions/components/AgentAnalysisSection';
import { Brain } from 'lucide-react';

export function PredictiveAIPanel({ userId: userIdProp }: { userId?: number } = {}) {
  const { t } = useTranslation();
  const { user } = useUser();
  const userId = userIdProp ?? user?.id ?? 0;
  const { data, dataUpdatedAt } = useCnnPredictions(userId);

  const lastWatchLabel = data?.last_watch_sample_at
    ? new Date(data.last_watch_sample_at).toLocaleString()
    : t('never', 'Never');

  return (
    <PageContainer scrollable className="min-w-0">
      <div className="flex w-full min-w-0 max-w-full flex-col gap-6 overflow-x-hidden">
        <Heading
          title={t('predictive_ai', 'Predictive AI')}
          description={t(
            'predictive_ai_desc',
            'Watch CNN scores each short window into window-risk tables. The clinical agent reviews your graph and vitals on a separate 8-hour schedule into clinical agent reports.'
          )}
        />

        <Card className="min-w-0 overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="pb-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-start gap-3">
              <div className="shrink-0 rounded-xl bg-muted p-2.5">
                <Brain className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg break-words">
                  {data?.model_name ?? 'SenioSentry BiLSTM-CNN'}
                </CardTitle>
                <CardDescription className="mt-1 max-w-full break-words">
                  {data?.description ??
                    t(
                      'cnn_model_blurb',
                      'The edge CNN scores short PPG/ECG windows to estimate blood pressure, atrial fibrillation probability, HRV, apnea risk, and overall cardiac risk.'
                    )}
                </CardDescription>
                <p className="mt-2 break-words text-xs text-muted-foreground">
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
                  {' · '}
                  {t('last_sample', 'Last wearable sample')}: {lastWatchLabel}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid min-w-0 gap-3 px-4 text-sm text-muted-foreground sm:px-6 md:grid-cols-2">
            <p className="break-words">
              <span className="font-semibold text-foreground">
                {t('input', 'Input')}:{' '}
              </span>
              {t(
                'cnn_input',
                '10s PPG/ECG windows @ 125 Hz from the watch, plus age/sex/weight demographics.'
              )}
            </p>
            <p className="break-words">
              <span className="font-semibold text-foreground">
                {t('output', 'Output')}:{' '}
              </span>
              {t(
                'cnn_output',
                'Predicted SBP/DBP, AF probability, RMSSD/SDNN, apnea probability, cardiac risk scores.'
              )}
            </p>
          </CardContent>
        </Card>

        {userId ? <CnnResultsCard userId={userId} /> : null}
        {userId ? <AgentAnalysisSection patientId={userId} /> : null}
      </div>
    </PageContainer>
  );
}
