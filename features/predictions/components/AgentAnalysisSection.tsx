'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { Brain, ChevronDown, ChevronUp, Clock, Loader2 } from 'lucide-react';
import { FindingsList } from '@/features/clinical-agent/components/FindingsList';
import { RecommendationsList } from '@/features/clinical-agent/components/RecommendationsList';
import { DecisionGraphPanel } from '@/features/clinical-agent/components/DecisionGraphPanel.lazy';
import { ScheduledReportsPanel } from '@/features/clinical-reports/components/ScheduledReportsPanel';
import { useClinicalReports } from '@/features/clinical-reports/api/useClinicalReports';
import { useClinicalReportDetail } from '@/features/clinical-reports/api/useClinicalReportDetail';
import type { CdsFinding, CdsRecommendation } from '@/features/clinical-agent/types/cds';
import type { ClinicalReportDetail } from '@/features/clinical-reports/types/reports';
import { cn } from '@/lib/utils';

const PREVIEW_FINDINGS = 2;
const PREVIEW_RECS = 2;

function mapScheduledReport(detail: ClinicalReportDetail): {
  overall_status: string;
  analyzed_at?: string;
  findings: CdsFinding[];
  recommendations: CdsRecommendation[];
} {
  const findings: CdsFinding[] = [];
  if (detail.overview) {
    findings.push({
      id: 'overview',
      title: 'Clinical overview',
      description: detail.overview,
      severity: (detail.priority as string) || 'moderate',
    });
  }
  for (const [i, item] of (detail.watch_items ?? []).entries()) {
    const text = typeof item === 'string' ? item : JSON.stringify(item);
    findings.push({
      id: `watch-${i}`,
      title: 'Watch item',
      description: text,
      severity: 'moderate',
      category: 'monitoring',
    });
  }

  const recommendations: CdsRecommendation[] = (detail.actions ?? []).map(
    (action, index) => {
      if (typeof action === 'string') {
        return {
          id: `action-${index}`,
          title: action,
          description: action,
          priority: detail.priority || 'medium',
        };
      }
      const title = action.title || action.description || `Action ${index + 1}`;
      return {
        id: `action-${index}`,
        title,
        description: action.description || title,
        priority: action.priority || detail.priority || 'medium',
      };
    }
  );

  return {
    overall_status: (detail.priority || detail.status || 'unknown').toUpperCase(),
    analyzed_at: detail.created_at,
    findings,
    recommendations,
  };
}

/**
 * Patient-facing agent analysis from the **8-hour scheduled** clinical agent
 * (`clinical_agent_reports` table) — not from CNN `window_risk_readings`.
 */
export function AgentAnalysisSection({ patientId }: { patientId: number }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const {
    data: listData,
    isLoading: listLoading,
    isError: listError,
    error: listErr,
  } = useClinicalReports(patientId);
  const latestSummary =
    listData?.reports?.find((r) => r.status === 'completed') ??
    listData?.reports?.[0] ??
    null;
  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
  } = useClinicalReportDetail(latestSummary?.report_uuid ?? null, {
    enabled: !!latestSummary?.report_uuid,
  });

  const mapped = useMemo(
    () => (detail ? mapScheduledReport(detail) : null),
    [detail]
  );

  const findings = mapped?.findings ?? [];
  const recommendations = mapped?.recommendations ?? [];

  const previewFindings = findings.slice(0, PREVIEW_FINDINGS);
  const restFindings = findings.slice(PREVIEW_FINDINGS);
  const previewRecs = recommendations.slice(0, PREVIEW_RECS);
  const restRecs = recommendations.slice(PREVIEW_RECS);
  const isLoading = listLoading || (!!latestSummary && detailLoading);
  const hiddenCount = restFindings.length + restRecs.length;
  const hasMore = hiddenCount > 0 || !!detail?.graph_snapshot;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-border/80">
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex min-w-0 items-center gap-2 text-lg">
              <Brain className="h-5 w-5 shrink-0" />
              <span className="truncate">
                {t('agent_analysis', 'Agent analysis')}
              </span>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1 font-normal">
                <Clock className="h-3 w-3" />
                {t('every_8_hours', 'Every 8 hours')}
              </Badge>
              {mapped?.overall_status ? (
                <Badge variant="secondary">{mapped.overall_status}</Badge>
              ) : null}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {t(
              'agent_analysis_desc_scheduled',
              'Scheduled clinical-agent review of your knowledge graph and vitals (separate from watch CNN scores). Stored in clinical agent reports — not written on every CNN window.'
            )}
          </p>
          {mapped?.analyzed_at ? (
            <p className="text-xs text-muted-foreground">
              {t('last_agent_run', 'Last agent run')}:{' '}
              {new Date(mapped.analyzed_at).toLocaleString()}
              {detail?.triggered_by ? (
                <> · {t('source', 'Source')}: {detail.triggered_by}</>
              ) : null}
            </p>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-4 px-4 pb-4 sm:px-6">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('loading_report', 'Loading clinical report...')}
            </div>
          ) : listError || detailError ? (
            <p className="text-sm text-destructive">
              {(listErr as Error)?.message ||
                t(
                  'failed_load_agent_report',
                  'Failed to load scheduled agent report.'
                )}
            </p>
          ) : !mapped ? (
            <p className="text-sm text-muted-foreground">
              {t(
                'no_scheduled_agent_yet',
                'No scheduled agent report yet. The clinical agent runs automatically every 8 hours for patients with indexed knowledge.'
              )}
            </p>
          ) : (
            <>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">
                  {t('critical_findings', 'Critical Findings')}
                  {findings.length > PREVIEW_FINDINGS ? (
                    <span className="ms-2 text-xs font-normal text-muted-foreground">
                      ({previewFindings.length}/{findings.length})
                    </span>
                  ) : null}
                </h3>
                <FindingsList findings={previewFindings} />
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold">
                  {t('recommendations', 'Recommendations')}
                  {recommendations.length > PREVIEW_RECS ? (
                    <span className="ms-2 text-xs font-normal text-muted-foreground">
                      ({previewRecs.length}/{recommendations.length})
                    </span>
                  ) : null}
                </h3>
                <RecommendationsList recommendations={previewRecs} />
              </section>

              <Collapsible open={expanded} onOpenChange={setExpanded}>
                <CollapsibleContent className="space-y-4">
                  {restFindings.length > 0 ? (
                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold text-muted-foreground">
                        {t('more_findings', 'More findings')}
                      </h3>
                      <FindingsList findings={restFindings} />
                    </section>
                  ) : null}
                  {restRecs.length > 0 ? (
                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold text-muted-foreground">
                        {t('more_recommendations', 'More recommendations')}
                      </h3>
                      <RecommendationsList recommendations={restRecs} />
                    </section>
                  ) : null}
                  <DecisionGraphPanel
                    decisionGraph={undefined}
                    causalGraph={undefined}
                    showDecisionFallback
                  />
                </CollapsibleContent>

                {hasMore ? (
                  <div className="pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => setExpanded((v) => !v)}
                      aria-expanded={expanded}
                    >
                      {expanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          {t('show_less_analysis', 'Show less')}
                        </>
                      ) : (
                        <>
                          <ChevronDown className={cn('h-4 w-4')} />
                          {hiddenCount > 0
                            ? t(
                                'show_full_analysis_more',
                                'Show full analysis ({{count}}+ more)',
                                { count: hiddenCount }
                              )
                            : t(
                                'show_full_analysis',
                                'Show full analysis & graphs'
                              )}
                        </>
                      )}
                    </Button>
                  </div>
                ) : null}
              </Collapsible>
            </>
          )}
        </CardContent>
      </Card>

      <ScheduledReportsPanel patientId={patientId} />
    </div>
  );
}
