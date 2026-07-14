'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { Brain, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useCdsReport } from '@/features/clinical-agent/api/useCdsReport';
import { FindingsList } from '@/features/clinical-agent/components/FindingsList';
import { RecommendationsList } from '@/features/clinical-agent/components/RecommendationsList';
import { DecisionGraphPanel } from '@/features/clinical-agent/components/DecisionGraphPanel.lazy';
import { ScheduledReportsPanel } from '@/features/clinical-reports/components/ScheduledReportsPanel';
import { cn } from '@/lib/utils';

const PREVIEW_FINDINGS = 2;
const PREVIEW_RECS = 2;

export function AgentAnalysisSection({ patientId }: { patientId: number }) {
  const { t } = useTranslation();
  const { data: report, isLoading } = useCdsReport(patientId);
  const [expanded, setExpanded] = useState(false);

  const findings = report?.critical_findings ?? [];
  const recommendations = report?.recommendations ?? [];
  const specialists = report?.specialist_outputs ?? [];

  const previewFindings = useMemo(
    () => findings.slice(0, PREVIEW_FINDINGS),
    [findings]
  );
  const restFindings = useMemo(
    () => findings.slice(PREVIEW_FINDINGS),
    [findings]
  );
  const previewRecs = useMemo(
    () => recommendations.slice(0, PREVIEW_RECS),
    [recommendations]
  );
  const restRecs = useMemo(
    () => recommendations.slice(PREVIEW_RECS),
    [recommendations]
  );

  const hasMore =
    restFindings.length > 0 ||
    restRecs.length > 0 ||
    specialists.length > 0 ||
    !!report;

  const hiddenCount =
    restFindings.length + restRecs.length + specialists.length;

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
            {report?.overall_status ? (
              <Badge variant="secondary">{report.overall_status}</Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {t(
              'agent_analysis_desc',
              'Clinical decision-support findings generated for your care team and shared with you.'
            )}
          </p>
          {report?.analyzed_at ? (
            <p className="text-xs text-muted-foreground">
              {t('last_analyzed', 'Last analyzed')}:{' '}
              {new Date(report.analyzed_at).toLocaleString()}
            </p>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-4 px-4 pb-4 sm:px-6">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('loading_report', 'Loading clinical report...')}
            </div>
          ) : !report ? (
            <p className="text-sm text-muted-foreground">
              {t(
                'no_agent_analysis_yet',
                'No clinical agent analysis is available yet. Your clinician can run one from the Clinical Agent panel.'
              )}
            </p>
          ) : (
            <>
              {/* Always-visible preview */}
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

                  {specialists.length > 0 ? (
                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold">
                        {t('agent_reasoning', 'How the agent decided')}
                      </h3>
                      <Accordion
                        type="single"
                        collapsible
                        className="rounded-lg border px-2 sm:px-4"
                      >
                        {specialists.map((output, index) => (
                          <AccordionItem
                            key={`${output.specialist}-${index}`}
                            value={`specialist-${index}`}
                          >
                            <AccordionTrigger className="text-start break-words">
                              {output.specialist}
                            </AccordionTrigger>
                            <AccordionContent className="space-y-2">
                              <p className="text-sm leading-relaxed">
                                {output.summary}
                              </p>
                              {output.evidence?.length ? (
                                <ul className="list-disc ps-5 text-sm text-muted-foreground">
                                  {output.evidence.map((item, evidenceIndex) => (
                                    <li key={evidenceIndex}>{item}</li>
                                  ))}
                                </ul>
                              ) : null}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </section>
                  ) : null}

                  <DecisionGraphPanel
                    decisionGraph={report.decision_graph}
                    causalGraph={report.causal_graph}
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
                          <ChevronDown
                            className={cn('h-4 w-4 transition-transform')}
                          />
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
