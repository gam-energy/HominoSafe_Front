import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CdsRecommendation } from "../types/cds";

interface RecommendationsListProps {
  recommendations: CdsRecommendation[];
}

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  const { t } = useTranslation();

  if (!recommendations.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("no_recommendations", "No recommendations available.")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((item, index) => (
        <Card key={item.id ?? index} className="overflow-hidden">
          <CardHeader className="pb-2 px-4 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <CardTitle className="min-w-0 text-base break-words">{item.title}</CardTitle>
              <Badge variant="secondary" className="w-fit shrink-0 self-start">
                {item.priority}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 px-4 sm:px-6">
            <p className="break-words text-sm leading-relaxed">{item.description}</p>
            {item.action && (
              <p className="break-words text-sm font-medium text-primary">{item.action}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
