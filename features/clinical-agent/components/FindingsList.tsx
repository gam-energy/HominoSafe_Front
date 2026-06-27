import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CdsFinding } from "../types/cds";
import { cn } from "@/lib/utils";

interface FindingsListProps {
  findings: CdsFinding[];
}

const severityClass = (severity: string) => {
  switch (severity) {
    case "critical":
      return "border-destructive/40 bg-destructive/5";
    case "high":
      return "border-orange-500/40 bg-orange-500/5";
    case "moderate":
      return "border-amber-500/40 bg-amber-500/5";
    default:
      return "border-muted";
  }
};

export function FindingsList({ findings }: FindingsListProps) {
  const { t } = useTranslation();

  if (!findings.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("no_critical_findings", "No critical findings reported.")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {findings.map((finding, index) => (
        <Card key={finding.id ?? index} className={cn("overflow-hidden border", severityClass(finding.severity))}>
          <CardHeader className="pb-2 px-4 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <CardTitle className="flex min-w-0 items-start gap-2 text-base break-words">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{finding.title}</span>
              </CardTitle>
              <Badge variant="outline" className="w-fit shrink-0 self-start">
                {finding.severity}
              </Badge>
            </div>
            {finding.category && (
              <p className="text-xs text-muted-foreground">{finding.category}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-2 px-4 sm:px-6">
            <p className="break-words text-sm leading-relaxed">{finding.description}</p>
            {finding.evidence?.length ? (
              <ul className="list-disc ps-5 text-sm text-muted-foreground">
                {finding.evidence.map((item, evidenceIndex) => (
                  <li key={evidenceIndex}>{item}</li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
