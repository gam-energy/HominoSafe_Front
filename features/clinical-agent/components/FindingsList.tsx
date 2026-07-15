'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import type { CdsFinding } from '../types/cds';
import { cn } from '@/lib/utils';

interface FindingsListProps {
  findings: CdsFinding[];
  /** Show title/severity only; expand for description. */
  expandableDetails?: boolean;
}

const severityClass = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'border-destructive/40 bg-destructive/5';
    case 'high':
      return 'border-orange-500/40 bg-orange-500/5';
    case 'moderate':
      return 'border-amber-500/40 bg-amber-500/5';
    default:
      return 'border-muted';
  }
};

function FindingRow({
  finding,
  expandableDetails,
}: {
  finding: CdsFinding;
  expandableDetails?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const hasBody = !!(finding.description || finding.evidence?.length);

  if (!expandableDetails || !hasBody) {
    return (
      <Card
        className={cn('overflow-hidden border', severityClass(finding.severity))}
      >
        <CardHeader className="px-4 pb-2 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <CardTitle className="flex min-w-0 items-start gap-2 text-base break-words">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{finding.title}</span>
            </CardTitle>
            <Badge variant="outline" className="w-fit shrink-0 self-start">
              {finding.severity}
            </Badge>
          </div>
        </CardHeader>
        {hasBody ? (
          <CardContent className="space-y-2 px-4 sm:px-6">
            {finding.description ? (
              <p className="break-words text-sm leading-relaxed">
                {finding.description}
              </p>
            ) : null}
            {finding.evidence?.length ? (
              <ul className="list-disc ps-5 text-sm text-muted-foreground">
                {finding.evidence.map((item, evidenceIndex) => (
                  <li key={evidenceIndex}>{item}</li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        ) : null}
      </Card>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card
        className={cn('overflow-hidden border', severityClass(finding.severity))}
      >
        <button
          type="button"
          className="w-full text-start"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <CardHeader className="px-4 py-3 sm:px-6">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="flex min-w-0 items-start gap-2 text-base break-words">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{finding.title}</span>
              </CardTitle>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline">{finding.severity}</Badge>
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </button>
        <CollapsibleContent>
          <CardContent className="space-y-2 border-t border-border/50 px-4 pt-3 pb-4 sm:px-6">
            {finding.description ? (
              <p className="break-words text-sm leading-relaxed">
                {finding.description}
              </p>
            ) : null}
            {finding.evidence?.length ? (
              <ul className="list-disc ps-5 text-sm text-muted-foreground">
                {finding.evidence.map((item, evidenceIndex) => (
                  <li key={evidenceIndex}>{item}</li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function FindingsList({
  findings,
  expandableDetails = false,
}: FindingsListProps) {
  const { t } = useTranslation();

  if (!findings.length) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          {t('no_critical_findings', 'No findings right now.')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {findings.map((finding, index) => (
        <FindingRow
          key={finding.id ?? index}
          finding={finding}
          expandableDetails={expandableDetails}
        />
      ))}
    </div>
  );
}
