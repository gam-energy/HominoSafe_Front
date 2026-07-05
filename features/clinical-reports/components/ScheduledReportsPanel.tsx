'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoaderIcon } from '@/components/chat/icons';
import { useClinicalReports } from '../api/useClinicalReports';
import { useClinicalReportDetail } from '../api/useClinicalReportDetail';

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
                className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {new Date(report.created_at).toLocaleString()}
                  </p>
                  {report.summary && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {report.summary}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {report.overall_status && (
                    <Badge variant="secondary">{report.overall_status}</Badge>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedUuid && (
          <div className="rounded-lg border p-4 space-y-3">
            {detailLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <LoaderIcon size={20} />
                {t('loading_report', 'Loading report...')}
              </div>
            ) : detail ? (
              <>
                {detail.overview && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">
                      {t('overview', 'Overview')}
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {detail.overview}
                    </p>
                  </div>
                )}
                {detail.recommended_actions && detail.recommended_actions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">
                      {t('recommended_actions', 'Recommended Actions')}
                    </h4>
                    <ul className="space-y-1">
                      {detail.recommended_actions.map((action, i) => (
                        <li key={i} className="text-sm">
                          <span className="font-medium">{action.title}</span>
                          {action.description && (
                            <span className="text-muted-foreground">
                              {' '}
                              — {action.description}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {detail.watch_items && detail.watch_items.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">
                      {t('watch_items', 'Watch Items')}
                    </h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {detail.watch_items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
