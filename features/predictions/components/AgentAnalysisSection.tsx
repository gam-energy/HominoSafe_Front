'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  ListChecks,
  AlertTriangle,
} from 'lucide-react';
import { FindingsList } from '@/features/clinical-agent/components/FindingsList';
import { RecommendationsList } from '@/features/clinical-agent/components/RecommendationsList';
import { DecisionGraphPanel } from '@/features/clinical-agent/components/DecisionGraphPanel.lazy';
import { ScheduledReportsPanel } from '@/features/clinical-reports/components/ScheduledReportsPanel';
import { useClinicalReports } from '@/features/clinical-reports/api/useClinicalReports';
import { useClinicalReportDetail } from '@/features/clinical-reports/api/useClinicalReportDetail';
import type { CdsFinding, CdsRecommendation } from '@/features/clinical-agent/types/cds';
import type { ClinicalReportDetail } from '@/features/clinical-reports/types/reports';
import { cn } from '@/lib/utils';

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

function friendlyStatus(status: string, t: (k: string, d: string) => string) {
  const s = status.toLowerCase();
  if (s.includes('critical')) return t('status_critical', 'Needs attention');
  if (s.includes('high')) return t('status_high', 'Higher priority');
  if (s.includes('medium') || s.includes('moderate'))
    return t('status_moderate', 'Worth a look');
  if (s.includes('low') || s.includes('completed') || s.includes('normal'))
    return t('status_ok', 'Looking okay');
  return status;
}

/**
 * Patient-facing agent analysis — compact summary first; details on demand.
 */
export function AgentAnalysisSection({ patientId }: { patientId: number }) {
  const { t } = useTranslation();
  const [openDetails, setOpenDetails] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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
  const isLoading = listLoading || (!!latestSummary && detailLoading);

  return (
    <div className="min-w-0 max-w-full space-y-4 overflow-x-hidden">
      <section className="min-w-0 overflow-hidden rounded-[1.5rem] border border-border/70 bg-card shadow-sm">
        <div className="relative border-b border-border/60 px-4 py-5 sm:px-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,hsl(221_70%_50%/0.06),transparent_45%,hsl(186_55%_40%/0.05))]"
          />
          <div className="relative flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h2 className="flex min-w-0 items-center gap-2 font-[family-name:var(--font-instrument)] text-xl font-semibold tracking-tight">
                <Brain className="h-5 w-5 shrink-0 text-primary" />
                <span className="break-words">
                  {t('care_check', 'Care check')}
                </span>
              </h2>
              <p className="text-sm text-muted-foreground">
                {t(
                  'care_check_blurb',
                  'A short automatic review of how you’re doing.'
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <Clock className="h-3 w-3" />
                {t('every_8_hours_short', 'Every 8 hours')}
              </span>
              {mapped?.overall_status ? (
                <Badge variant="secondary" className="rounded-xl">
                  {friendlyStatus(mapped.overall_status, t)}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-3 px-4 py-5 sm:px-6 sm:pb-6">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('loading_check', 'Loading your care check...')}
            </div>
          ) : listError || detailError ? (
            <p className="text-sm text-destructive">
              {(listErr as Error)?.message ||
                t('failed_load_care_check', 'Couldn’t load the latest care check.')}
            </p>
          ) : !mapped ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t(
                  'no_care_check_yet',
                  'No care check yet. We’ll run one automatically every 8 hours.'
                )}
              </p>
            </div>
          ) : (
            <>
              {/* Compact human summary — no long text */}
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-3">
                  <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                    {t('last_checked', 'Last checked')}
                  </p>
                  <p className="mt-1 text-sm font-semibold ltr-nums">
                    {mapped.analyzed_at
                      ? new Date(mapped.analyzed_at).toLocaleString()
                      : '—'}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-3">
                  <p className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                    <AlertTriangle className="h-3 w-3" />
                    {t('findings', 'Findings')}
                  </p>
                  <p className="mt-1 text-sm font-semibold ltr-nums">
                    {findings.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-3">
                  <p className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                    <ListChecks className="h-3 w-3" />
                    {t('suggestions', 'Suggestions')}
                  </p>
                  <p className="mt-1 text-sm font-semibold ltr-nums">
                    {recommendations.length}
                  </p>
                </div>
              </div>

              <Collapsible open={openDetails} onOpenChange={setOpenDetails}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 rounded-xl"
                  onClick={() => setOpenDetails((v) => !v)}
                  aria-expanded={openDetails}
                >
                  {openDetails ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      {t('hide_details', 'Hide details')}
                    </>
                  ) : (
                    <>
                      <ChevronDown className={cn('h-4 w-4')} />
                      {t('show_details', 'Show details')}
                    </>
                  )}
                </Button>

                <CollapsibleContent className="mt-4 space-y-4">
                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold">
                      {t('findings', 'Findings')}
                    </h3>
                    <FindingsList findings={findings} expandableDetails />
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold">
                      {t('suggestions', 'Suggestions')}
                    </h3>
                    <RecommendationsList
                      recommendations={recommendations}
                      expandableDetails
                    />
                  </section>

                  <Collapsible open={showHelp} onOpenChange={setShowHelp}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-muted-foreground"
                      onClick={() => setShowHelp((v) => !v)}
                    >
                      {showHelp ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                      {t('about_this_check', 'About this check')}
                    </Button>
                    <CollapsibleContent className="mt-2 space-y-3">
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {t(
                          'agent_analysis_desc_scheduled',
                          'Scheduled clinical-agent review of your knowledge graph and vitals (separate from watch CNN scores).'
                        )}
                      </p>
                      <DecisionGraphPanel
                        decisionGraph={undefined}
                        causalGraph={undefined}
                        showDecisionFallback
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </div>
      </section>

      <ScheduledReportsPanel patientId={patientId} />
    </div>
  );
}
