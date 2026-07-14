'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { CausalGraphPayload, DecisionGraphPayload } from '../types/cds';

type Props = {
  decisionGraph?: DecisionGraphPayload | null;
  causalGraph?: CausalGraphPayload | null;
  showDecisionFallback?: boolean;
};

export const DecisionGraphPanel = dynamic<Props>(
  () => import('./DecisionGraphPanel').then((mod) => mod.DecisionGraphPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-40 items-center justify-center gap-2 rounded-xl border border-border/80 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading decision graph…
      </div>
    ),
  }
);
