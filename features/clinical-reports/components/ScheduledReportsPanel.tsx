'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, ChevronRight, Pill } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoaderIcon } from '@/components/chat/icons';
import { useClinicalReports } from '../api/useClinicalReports';
import { useClinicalReportDetail } from '../api/useClinicalReportDetail';
import { AdherenceSummaryBlock } from './AdherenceSummaryBlock';

function actionLabel(action: { title?: string; description?: string } | string) {
  if (typeof action === 'string') return action;
  if (action.title && action.description) {
    return `${action.title} — ${action.description}`;
  }
  return action.title || action.description || '';
}

export function ScheduledReportsPanel({ patientId }: { patientId: number }) {
  const { t } = useTranslation();
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);

  const { data: listData, isLoading: listLoading } = useClinicalReports(patientId);
  const { data: detail, isLoading: detailLoading } = useClinicalReportDetail(
    selectedUuid,
    { enabled: !!selectedUuid }
  );

  const reports = listData?.reports ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Clock className="h-5 w-5 shrink-0 text-primary" />
          {t('scheduled_reports', 'Scheduled Agent Reports')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t(
            'scheduled_reports_desc',
            'Graph-grounded reports generated every 8 hours by the clinical agent.'
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-6 sm:px-6">
        {listLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <LoaderIcon size={20} />
            {t('loading', 'Loading...')}
          </div>
        ) : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('no_scheduled_reports', 'No scheduled reports yet.')}
          </p>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <button
                key={report.report_uuid}
                type="button"
                onClick={() =>
                  setSelectedUuid(
                    selectedUuid === report.report_uuid ? null : report.report_uuid
                  )
                }
                className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {new Date(report.created_at).toLocaleString()}
                  </p>
                  {report.overview ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {report.overview}
                    </p>
                  ) : null}
                </div>
                <div className="ml-2 flex shrink-0 items-center gap-2">
                  {report.status ? (
                    <Badge variant="secondary">{report.status}</Badge>
                  ) : null}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedUuid ? (
          <div className="space-y-3 rounded-lg border p-4">
            {detailLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <LoaderIcon size={20} />
                {t('loading_report', 'Loading report...')}
              </div>
            ) : detail ? (
              <>
                {detail.overview ? (
                  <div>
                    <h4 className="mb-1 text-sm font-semibold">
                      {t('overview', 'Overview')}
                    </h4>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {detail.overview}
                    </p>
                  </div>
                ) : null}
                {detail.actions && detail.actions.length > 0 ? (
                  <div>
                    <h4 className="mb-1 text-sm font-semibold">
                      {t('recommended_actions', 'Recommended Actions')}
                    </h4>
                    <ul className="space-y-1">
                      {detail.actions.map((action, i) => (
                        <li key={i} className="text-sm">
                          {actionLabel(action)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {detail.watch_items && detail.watch_items.length > 0 ? (
                  <div>
                    <h4 className="mb-1 text-sm font-semibold">
                      {t('watch_items', 'Watch Items')}
                    </h4>
                    <ul className="list-inside list-disc text-sm text-muted-foreground">
                      {detail.watch_items.map((item, i) => (
                        <li key={i}>
                          {typeof item === 'string' ? item : JSON.stringify(item)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {detail.adherence_summary ? (
                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                      <Pill className="h-4 w-4 text-primary" />
                      {t('med_adherence_today', 'Medication adherence (today)')}
                    </h4>
                    <AdherenceSummaryBlock summary={detail.adherence_summary.today} />
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
