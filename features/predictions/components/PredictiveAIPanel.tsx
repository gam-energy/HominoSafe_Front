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
    <PageContainer scrollable>
      <div className="flex w-full flex-col gap-6">
        <Heading
          title={t('predictive_ai', 'Predictive AI')}
          description={t(
            'predictive_ai_desc',
            'CNN model predictions from your watch stream, plus clinical agent analysis'
          )}
        />

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
                  {' · '}
                  {t('last_sample', 'Last wearable sample')}: {lastWatchLabel}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
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
          </CardContent>
        </Card>

        {userId ? <CnnResultsCard userId={userId} /> : null}
        {userId ? <AgentAnalysisSection patientId={userId} /> : null}
      </div>
    </PageContainer>
  );
}
