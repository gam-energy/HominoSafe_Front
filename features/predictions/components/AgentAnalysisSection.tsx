'use client';

import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2 } from 'lucide-react';
import { useCdsReport } from '@/features/clinical-agent/api/useCdsReport';
import { FindingsList } from '@/features/clinical-agent/components/FindingsList';
import { RecommendationsList } from '@/features/clinical-agent/components/RecommendationsList';
import { ScheduledReportsPanel } from '@/features/clinical-reports/components/ScheduledReportsPanel';

export function AgentAnalysisSection({ patientId }: { patientId: number }) {
  const { t } = useTranslation();
  const { data: report, isLoading } = useCdsReport(patientId);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-border/80">
        <CardHeader className="px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 shrink-0" />
              {t('agent_analysis', 'Agent analysis')}
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
        <CardContent className="space-y-4 px-4 pb-6 sm:px-6">
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
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">
                  {t('critical_findings', 'Critical Findings')}
                </h3>
                <FindingsList findings={report.critical_findings ?? []} />
              </section>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">
                  {t('recommendations', 'Recommendations')}
                </h3>
                <RecommendationsList
                  recommendations={report.recommendations ?? []}
                />
              </section>
              {report.specialist_outputs?.length ? (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">
                    {t('agent_reasoning', 'How the agent decided')}
                  </h3>
                  <Accordion
                    type="single"
                    collapsible
                    className="rounded-lg border px-2 sm:px-4"
                  >
                    {report.specialist_outputs.map((output, index) => (
                      <AccordionItem
                        key={`${output.specialist}-${index}`}
                        value={`specialist-${index}`}
                      >
                        <AccordionTrigger className="text-start break-words">
                          {output.specialist}
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2">
                          <p className="text-sm leading-relaxed">{output.summary}</p>
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
            </>
          )}
        </CardContent>
      </Card>

      <ScheduledReportsPanel patientId={patientId} />
    </div>
  );
}
