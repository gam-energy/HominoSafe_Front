'use client';

import { useMemo } from 'react';
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTranslation } from 'react-i18next';
import { GitBranch, Network } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  CausalGraphPayload,
  DecisionGraphPayload,
} from '@/features/clinical-agent/types/cds';

const DECISION_NODE_STYLE: React.CSSProperties = {
  borderRadius: 12,
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--card))',
  color: 'hsl(var(--card-foreground))',
  padding: '8px 12px',
  fontSize: 12,
  fontWeight: 600,
  minWidth: 120,
  textAlign: 'center',
  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
};

function layoutDecision(payload?: DecisionGraphPayload | null): {
  nodes: Node[];
  edges: Edge[];
} {
  const steps = payload?.nodes?.length
    ? [...payload.nodes].sort((a, b) => a.order - b.order)
    : [
        { id: 'observe', label: 'Observe', description: '', status: 'completed', order: 0 },
        { id: 'interpret', label: 'Interpret', description: '', status: 'completed', order: 1 },
        { id: 'hypothesize', label: 'Hypothesize', description: '', status: 'completed', order: 2 },
        {
          id: 'retrieve_evidence',
          label: 'Evidence',
          description: '',
          status: 'completed',
          order: 3,
        },
        { id: 'recommend', label: 'Recommend', description: '', status: 'completed', order: 4 },
        { id: 'critique', label: 'Critique', description: '', status: 'completed', order: 5 },
        { id: 'learn', label: 'Learn', description: '', status: 'completed', order: 6 },
      ];

  const nodes: Node[] = steps.map((step, index) => {
    const degraded = step.status === 'degraded';
    return {
      id: step.id,
      position: { x: 24 + index * 160, y: 40 },
      data: {
        label: (
          <div className="space-y-1">
            <div>{step.label}</div>
            {step.description ? (
              <div className="text-[10px] font-normal text-muted-foreground leading-snug max-w-[130px]">
                {step.description}
              </div>
            ) : null}
          </div>
        ),
      },
      style: {
        ...DECISION_NODE_STYLE,
        borderColor: degraded ? 'hsl(var(--destructive))' : 'hsl(var(--border))',
        background: degraded
          ? 'hsl(var(--destructive) / 0.08)'
          : 'hsl(var(--primary) / 0.08)',
      },
    };
  });

  const edges: Edge[] = (payload?.edges?.length
    ? payload.edges
    : steps.slice(1).map((step, i) => ({
        id: `e-${steps[i].id}-${step.id}`,
        source: steps[i].id,
        target: step.id,
        label: 'next',
      }))
  ).map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: true,
    style: { stroke: 'hsl(var(--primary))' },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' },
  }));

  return { nodes, edges };
}

function layoutCausal(payload?: CausalGraphPayload | null): {
  nodes: Node[];
  edges: Edge[];
} {
  const rawNodes = payload?.nodes ?? [];
  const rawEdges = payload?.edges ?? [];
  if (!rawNodes.length) {
    return { nodes: [], edges: [] };
  }

  const kindColor: Record<string, string> = {
    cause: 'hsl(199 70% 42%)',
    effect: 'hsl(12 70% 48%)',
    condition: 'hsl(262 50% 48%)',
    finding: 'hsl(32 80% 44%)',
    evidence: 'hsl(150 40% 36%)',
    entity: 'hsl(var(--muted-foreground))',
  };

  const columns: Record<string, number> = {
    evidence: 0,
    cause: 0,
    condition: 1,
    finding: 1,
    effect: 2,
    entity: 1,
  };
  const rowCounter: Record<number, number> = {};

  const nodes: Node[] = rawNodes.map((n) => {
    const col = columns[n.kind] ?? 1;
    rowCounter[col] = (rowCounter[col] ?? 0) + 1;
    const row = rowCounter[col] - 1;
    const accent = kindColor[n.kind] ?? kindColor.entity;
    return {
      id: n.id,
      position: { x: 40 + col * 220, y: 30 + row * 90 },
      data: {
        label: (
          <div className="space-y-0.5">
            <div className="text-[10px] uppercase tracking-wide opacity-70">
              {n.kind}
            </div>
            <div>{n.label}</div>
          </div>
        ),
      },
      style: {
        ...DECISION_NODE_STYLE,
        borderColor: accent,
        background: `color-mix(in srgb, ${accent} 12%, hsl(var(--card)))`,
        minWidth: 140,
        maxWidth: 180,
      },
    };
  });

  const edges: Edge[] = rawEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.relationship_type.replace(/_/g, ' '),
    animated: e.confidence >= 0.6,
    style: {
      stroke: `hsl(var(--foreground) / ${0.35 + Math.min(e.confidence, 1) * 0.45})`,
      strokeWidth: 1.5 + Math.min(e.confidence, 1),
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'hsl(var(--foreground) / 0.65)',
    },
  }));

  return { nodes, edges };
}

function FlowCanvas({
  nodes,
  edges,
  height = 260,
}: {
  nodes: Node[];
  edges: Edge[];
  height?: number;
}) {
  return (
    <div
      className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border/80 bg-muted/20"
      style={{ height }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        minZoom={0.35}
        maxZoom={1.6}
      >
        <Background gap={18} size={1} />
        <MiniMap
          pannable
          zoomable
          className="!bg-background/90"
          maskColor="hsl(var(--background) / 0.55)"
        />
        <Controls showInteractive={false} className="!bg-background/90 !shadow-sm" />
      </ReactFlow>
    </div>
  );
}

export function DecisionGraphPanel({
  decisionGraph,
  causalGraph,
  showDecisionFallback = true,
}: {
  decisionGraph?: DecisionGraphPayload | null;
  causalGraph?: CausalGraphPayload | null;
  /** When true, still show the cognitive loop even without a saved report. */
  showDecisionFallback?: boolean;
}) {
  const { t } = useTranslation();
  const decision = useMemo(
    () => layoutDecision(decisionGraph),
    [decisionGraph]
  );
  const causal = useMemo(() => layoutCausal(causalGraph), [causalGraph]);

  const hasDecision = showDecisionFallback || (decisionGraph?.nodes?.length ?? 0) > 0;
  const hasCausal = (causalGraph?.edges?.length ?? 0) > 0;

  if (!hasDecision && !hasCausal) return null;

  return (
    <div className="space-y-4">
      {hasDecision ? (
        <Card className="overflow-hidden border-border/80">
          <CardHeader className="px-4 sm:px-6 pb-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <GitBranch className="h-4 w-4 shrink-0" />
              {t('decision_graph', 'Decision graph')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t(
                'decision_graph_desc',
                'How the clinical agent walks the observe → interpret → evidence → recommend loop for this analysis.'
              )}
            </p>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-5">
            <FlowCanvas nodes={decision.nodes} edges={decision.edges} height={240} />
          </CardContent>
        </Card>
      ) : null}

      {hasCausal ? (
        <Card className="overflow-hidden border-border/80">
          <CardHeader className="px-4 sm:px-6 pb-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Network className="h-4 w-4 shrink-0" />
              {t('causal_graph', 'Knowledge graph grounding')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t(
                'causal_graph_desc',
                'Cause → effect relationships grounded in the medical knowledge graph for this run.'
              )}
            </p>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-5">
            <FlowCanvas nodes={causal.nodes} edges={causal.edges} height={320} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
