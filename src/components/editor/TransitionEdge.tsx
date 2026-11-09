import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, useInternalNode, type EdgeProps, type InternalNode } from '@xyflow/react';
import { edgeGeometry, loopGeometry, NODE_SIZE } from './geometry';
import type { EdgeVisual, TransitionFlowEdge } from './flowElements';
import { useUiStore } from '../../stores/uiStore';
import { cn } from '../../utils/cn';

const center = (node: InternalNode) => ({
  x: node.internals.positionAbsolute.x + NODE_SIZE / 2,
  y: node.internals.positionAbsolute.y + NODE_SIZE / 2,
});

const strokes: Record<EdgeVisual, string> = {
  idle: 'var(--as-fg-subtle)',
  active: 'var(--as-accent)',
  invalid: 'var(--as-danger)',
};

/** Identificador do marcador de seta de cada aparência (ver `ArrowMarkers`). */
export const markerId = (visual: EdgeVisual | 'selected') => `as-arrow-${visual}`;

/**
 * Aresta direcionada entre estados. Uma única aresta agrupa todos os símbolos
 * do par (origem, destino); os símbolos usados na etapa corrente são
 * destacados e os inválidos aparecem em vermelho.
 */
export const TransitionEdge = memo(function TransitionEdge({ id, source, target, data, selected }: EdgeProps<TransitionFlowEdge>) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const select = useUiStore((s) => s.select);
  const openTransitionDraft = useUiStore((s) => s.openTransitionDraft);

  if (!sourceNode || !targetNode || !data) return null;

  const geometry =
    source === target ? loopGeometry(center(sourceNode)) : edgeGeometry(center(sourceNode), center(targetNode), data.curved);
  const visual = data.visual;

  return (
    <>
      <BaseEdge
        id={id}
        path={geometry.path}
        markerEnd={`url(#${markerId(selected ? 'selected' : visual)})`}
        interactionWidth={18}
        className={cn(visual === 'active' && 'as-edge-active')}
        style={{
          stroke: strokes[visual],
          strokeWidth: visual === 'active' ? 2.5 : 1.75,
          strokeDasharray: visual === 'invalid' ? '5 4' : undefined,
          transition: 'stroke 250ms',
        }}
      />
      <EdgeLabelRenderer>
        <button
          type="button"
          className={cn(
            'nodrag nopan absolute flex items-center gap-0.5 rounded-md border px-1 py-0.5 font-mono text-xs shadow-sm transition-colors',
            selected ? 'border-accent bg-surface' : 'border-line bg-surface hover:border-line-strong',
          )}
          style={{
            transform: `translate(-50%, -50%) translate(${geometry.label.x}px, ${geometry.label.y}px)`,
            pointerEvents: 'all',
          }}
          onClick={() => select({ kind: 'edge', from: data.from, to: data.to })}
          onDoubleClick={() => openTransitionDraft({ from: data.from, to: data.to })}
          title={`Transições de ${data.from} para ${data.to} (duplo clique para editar)`}
        >
          {data.symbols.map((symbol, i) => (
            <span key={symbol} className="flex items-center">
              {i > 0 && <span className="pr-0.5 text-fg-subtle">,</span>}
              <span
                className={cn(
                  'rounded px-1 font-semibold transition-colors duration-200',
                  data.activeSymbols.includes(symbol)
                    ? 'bg-accent text-on-accent'
                    : data.invalidSymbols.includes(symbol)
                      ? 'text-danger line-through decoration-danger/60'
                      : 'text-fg',
                )}
              >
                {symbol}
              </span>
            </span>
          ))}
        </button>
      </EdgeLabelRenderer>
    </>
  );
});

/** Definições SVG dos marcadores de seta, uma por aparência. */
export function ArrowMarkers() {
  const markers: Array<[EdgeVisual | 'selected', string]> = [
    ['idle', 'var(--as-fg-subtle)'],
    ['active', 'var(--as-accent)'],
    ['invalid', 'var(--as-danger)'],
    ['selected', 'var(--as-accent-strong)'],
  ];
  return (
    <svg aria-hidden style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        {markers.map(([visual, color]) => (
          <marker
            key={visual}
            id={markerId(visual)}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="9"
            markerHeight="9"
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" style={{ fill: color }} />
          </marker>
        ))}
      </defs>
    </svg>
  );
}
