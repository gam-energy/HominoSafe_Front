'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, ChevronUp, Clock, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { LoaderIcon } from '@/components/chat/icons';
import { useClinicalReports } from '../api/useClinicalReports';
import { useClinicalReportDetail } from '../api/useClinicalReportDetail';
import { AdherenceSummaryBlock } from './AdherenceSummaryBlock';
import { cn } from '@/lib/utils';

function actionTitle(action: { title?: string; description?: string } | string) {
  if (typeof action === 'string') return action;
  return action.title || action.description || '';
}

function actionBody(action: { title?: string; description?: string } | string) {
  if (typeof action === 'string') return null;
  if (action.title && action.description && action.title !== action.description) {
    return action.description;
  }
  return null;
}

function friendlyPriority(priority: string | undefined, t: (k: string, d: string) => string) {
  const p = (priority || '').toLowerCase();
  if (p.includes('critical')) return t('status_critical', 'Needs attention');
  if (p.includes('high')) return t('status_high', 'Higher priority');
  if (p.includes('medium') || p.includes('moderate'))
    return t('status_moderate', 'Worth a look');
  if (p.includes('low')) return t('status_ok', 'Looking okay');
  return priority || t('report', 'Report');
}

export function ScheduledReportsPanel({ patientId }: { patientId: number }) {
  const { t } = useTranslation();
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [showBody, setShowBody] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const { data: listData, isLoading: listLoading } = useClinicalReports(patientId);
  const { data: detail, isLoading: detailLoading } = useClinicalReportDetail(
    selectedUuid,
    { enabled: !!selectedUuid }
  );

  const reports = listData?.reports ?? [];

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.5rem] border border-border/70 bg-card shadow-sm">
      <div className="border-b border-border/60 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 className="flex items-center gap-2 font-[family-name:var(--font-instrument)] text-xl font-semibold tracking-tight">
              <Clock className="h-5 w-5 shrink-0 text-primary" />
              {t('past_care_checks', 'Past care checks')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('past_care_checks_blurb', 'Earlier automatic reviews — tap one to open.')}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 text-xs text-muted-foreground"
            onClick={() => setShowAbout((v) => !v)}
          >
            {showAbout ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            {t('about', 'About')}
          </Button>
        </div>
        {showAbout ? (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {t(
              'scheduled_reports_desc',
              'Graph-grounded reports generated every 8 hours by the clinical agent.'
            )}
          </p>
        ) : null}
      </div>

      <div className="space-y-3 px-4 py-5 sm:px-6 sm:pb-6">
        {listLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <LoaderIcon size={20} />
            {t('loading', 'Loading...')}
          </div>
        ) : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('no_scheduled_reports', 'No past care checks yet.')}
          </p>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => {
              const selected = selectedUuid === report.report_uuid;
              return (
                <button
                  key={report.report_uuid}
                  type="button"
                  onClick={() => {
                    setSelectedUuid(selected ? null : report.report_uuid);
                    setShowBody(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-colors hover:bg-muted/40',
                    selected && 'border-primary/40 bg-muted/30'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold ltr-nums">
                      {new Date(report.created_at).toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {friendlyPriority(report.priority ?? report.status, t)}
                    </p>
                  </div>
                  <div className="ms-2 flex shrink-0 items-center gap-2">
                    {report.status ? (
                      <Badge variant="secondary" className="rounded-lg capitalize">
                        {report.status}
                      </Badge>
                    ) : null}
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 text-muted-foreground transition-transform',
                        selected && 'rotate-90'
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selectedUuid ? (
          <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/15 p-4">
            {detailLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <LoaderIcon size={20} />
                {t('loading_report', 'Loading report...')}
              </div>
            ) : detail ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {friendlyPriority(detail.priority ?? detail.status, t)}
                  </p>
                  <p className="text-xs text-muted-foreground ltr-nums">
                    {new Date(detail.created_at).toLocaleString()}
                  </p>
                </div>

                {detail.adherence_summary ? (
                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                      <Pill className="h-4 w-4 text-primary" />
                      {t('med_adherence_today', 'Medication today')}
                    </h4>
                    <AdherenceSummaryBlock summary={detail.adherence_summary.today} />
                  </div>
                ) : null}

                <Collapsible open={showBody} onOpenChange={setShowBody}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 rounded-xl"
                    onClick={() => setShowBody((v) => !v)}
                  >
                    {showBody ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        {t('hide_report_details', 'Hide report text')}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        {t('show_report_details', 'Show report text')}
                      </>
                    )}
                  </Button>
                  <CollapsibleContent className="mt-3 space-y-4">
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
                        <h4 className="mb-2 text-sm font-semibold">
                          {t('suggestions', 'Suggestions')}
                        </h4>
                        <ul className="space-y-2">
                          {detail.actions.map((action, i) => {
                            const body = actionBody(action);
                            return (
                              <li
                                key={i}
                                className="rounded-xl border border-border/50 bg-background/60 px-3 py-2"
                              >
                                <p className="text-sm font-medium">
                                  {actionTitle(action)}
                                </p>
                                {body ? (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {body}
                                  </p>
                                ) : null}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : null}
                    {detail.watch_items && detail.watch_items.length > 0 ? (
                      <div>
                        <h4 className="mb-1 text-sm font-semibold">
                          {t('watch_notes', 'Watch notes')}
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
                  </CollapsibleContent>
                </Collapsible>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
