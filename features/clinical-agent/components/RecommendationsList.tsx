'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import type { CdsRecommendation } from '../types/cds';

interface RecommendationsListProps {
  recommendations: CdsRecommendation[];
  /** Show title/priority only; expand for description. */
  expandableDetails?: boolean;
}

function RecommendationRow({
  item,
  expandableDetails,
}: {
  item: CdsRecommendation;
  expandableDetails?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const hasBody = !!(item.description || item.action);
  const descriptionSameAsTitle =
    item.description &&
    item.title &&
    item.description.trim() === item.title.trim();

  if (!expandableDetails || !hasBody || descriptionSameAsTitle) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="px-4 pb-2 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <CardTitle className="min-w-0 text-base break-words">
              {item.title}
            </CardTitle>
            <Badge variant="secondary" className="w-fit shrink-0 self-start">
              {item.priority}
            </Badge>
          </div>
        </CardHeader>
        {!expandableDetails && hasBody && !descriptionSameAsTitle ? (
          <CardContent className="space-y-2 px-4 sm:px-6">
            {item.description ? (
              <p className="break-words text-sm leading-relaxed">
                {item.description}
              </p>
            ) : null}
            {item.action ? (
              <p className="break-words text-sm font-medium text-primary">
                {item.action}
              </p>
            ) : null}
          </CardContent>
        ) : null}
      </Card>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden">
        <button
          type="button"
          className="w-full text-start"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <CardHeader className="px-4 py-3 sm:px-6">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="min-w-0 text-base break-words">
                {item.title}
              </CardTitle>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="secondary">{item.priority}</Badge>
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
            {item.description ? (
              <p className="break-words text-sm leading-relaxed">
                {item.description}
              </p>
            ) : null}
            {item.action ? (
              <p className="break-words text-sm font-medium text-primary">
                {item.action}
              </p>
            ) : null}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function RecommendationsList({
  recommendations,
  expandableDetails = false,
}: RecommendationsListProps) {
  const { t } = useTranslation();

  if (!recommendations.length) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          {t('no_recommendations', 'No suggestions right now.')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {recommendations.map((item, index) => (
        <RecommendationRow
          key={item.id ?? index}
          item={item}
          expandableDetails={expandableDetails}
        />
      ))}
    </div>
  );
}
