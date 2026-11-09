import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  ReactFlow,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type NodeChange,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import { MousePointerClick } from 'lucide-react';
import { StateNode } from './StateNode';
import { ArrowMarkers, TransitionEdge } from './TransitionEdge';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasLegend } from './CanvasLegend';
import { buildEdges, buildNodes, mergeNodes, type StateFlowNode, type TransitionFlowEdge } from './flowElements';
import { NODE_SIZE } from './geometry';
import { autoLayout } from '../../core/automata/layout';
import { addState, moveState, removeState, setEdgeSymbols } from '../../core/automata/operations';
import type { AutomatonProject, ValidationIssue } from '../../core/automata/types';
import { useActiveProject } from '../../hooks/useActiveProject';
import { useSimulationHighlight } from '../../hooks/useSimulationHighlight';
import { useUiStore } from '../../stores/uiStore';

const nodeTypes: NodeTypes = { state: StateNode };
const edgeTypes: EdgeTypes = { transition: TransitionEdge };

interface AutomatonCanvasProps {
  project: AutomatonProject;
  issues: readonly ValidationIssue[];
}

/**
 * Editor visual do autômato. O grafo é derivado do projeto; as interações
 * (arrastar, conectar, excluir) são traduzidas em operações puras do núcleo.
 * Arrastar nós altera apenas o layout, nunca a definição formal.
 */
export function AutomatonCanvas({ project, issues }: AutomatonCanvasProps) {
  const { edit } = useActiveProject();
  const highlight = useSimulationHighlight();
  const selection = useUiStore((s) => s.selection);
  const select = useUiStore((s) => s.select);
  const openTransitionDraft = useUiStore((s) => s.openTransitionDraft);
  const { fitView, screenToFlowPosition } = useReactFlow<StateFlowNode, TransitionFlowEdge>();

  const builtNodes = useMemo(
    () => buildNodes(project, issues, highlight, selection),
    [project, issues, highlight, selection],
  );
  const edges = useMemo(() => buildEdges(project, issues, highlight, selection), [project, issues, highlight, selection]);

  // Estado local para que o React Flow mantenha medidas e o arraste fluido.
  const [nodes, setNodes] = useState<StateFlowNode[]>(builtNodes);
  useEffect(() => setNodes((previous) => mergeNodes(previous, builtNodes)), [builtNodes]);

  // Enquadra o grafo ao trocar de projeto.
  useEffect(() => {
    const frame = requestAnimationFrame(() => void fitView({ padding: 0.35, duration: 250, maxZoom: 1.3 }));
    return () => cancelAnimationFrame(frame);
  }, [project.id, fitView]);

  const onNodesChange = useCallback((changes: NodeChange<StateFlowNode>[]) => {
    // Seleção e remoção são controladas pela aplicação, não pelo React Flow.
    const relevant = changes.filter((c) => c.type === 'position' || c.type === 'dimensions');
    if (relevant.length > 0) setNodes((nds) => applyNodeChanges(relevant, nds));
  }, []);

  const onNodeDragStop = useCallback(
    (_: unknown, __: StateFlowNode, dragged: StateFlowNode[]) => {
      edit((p) => dragged.reduce((acc, n) => moveState(acc, n.id, { x: Math.round(n.position.x), y: Math.round(n.position.y) }), p));
    },
    [edit],
  );

  const onConnect = useCallback(
    (connection: Connection) => openTransitionDraft({ from: connection.source, to: connection.target }),
    [openTransitionDraft],
  );

  const addStateAt = useCallback(
    (position?: { x: number; y: number }) => {
      edit((p) => addState(p, undefined, position));
    },
    [edit],
  );

  const onDoubleClick = (event: MouseEvent) => {
    if (!(event.target instanceof Element) || !event.target.classList.contains('react-flow__pane')) return;
    const point = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    addStateAt({ x: Math.round(point.x - NODE_SIZE / 2), y: Math.round(point.y - NODE_SIZE / 2) });
  };

  const autoArrange = () => {
    edit((p) => ({ ...p, layout: autoLayout(p.definition.states) }));
    requestAnimationFrame(() => void fitView({ padding: 0.35, duration: 300, maxZoom: 1.3 }));
  };

  const isEmpty = project.definition.states.length === 0;

  return (
    <div className="relative h-full w-full" onDoubleClick={onDoubleClick}>
      <ArrowMarkers />
      <ReactFlow<StateFlowNode, TransitionFlowEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onNodeClick={(_, node) => select({ kind: 'state', name: node.id })}
        onEdgeClick={(_, edge) => edge.data && select({ kind: 'edge', from: edge.data.from, to: edge.data.to })}
        onEdgeDoubleClick={(_, edge) => edge.data && openTransitionDraft({ from: edge.data.from, to: edge.data.to })}
        onPaneClick={() => select(null)}
        onNodesDelete={(deleted) => {
          edit((p) => deleted.reduce((acc, n) => removeState(acc, n.id), p));
          select(null);
        }}
        onEdgesDelete={(deleted) => {
          edit((p) => deleted.reduce((acc, e) => setEdgeSymbols(acc, e.source, e.target, []), p));
          select(null);
        }}
        deleteKeyCode={['Delete', 'Backspace']}
        zoomOnDoubleClick={false}
        connectionRadius={36}
        minZoom={0.2}
        maxZoom={2.5}
        fitView={!isEmpty}
        fitViewOptions={{ padding: 0.35, maxZoom: 1.3 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.6} />
        <Controls showInteractive={false} position="bottom-right" />
        <Panel position="top-left">
          <CanvasToolbar
            onAddState={() => addStateAt()}
            onAutoLayout={autoArrange}
            onFitView={() => void fitView({ padding: 0.35, duration: 300, maxZoom: 1.3 })}
          />
        </Panel>
        <Panel position="bottom-left">
          <CanvasLegend />
        </Panel>
        {isEmpty && (
          <Panel position="top-center" className="top-1/3!">
            <div className="animate-fade-in flex flex-col items-center gap-2 text-center text-sm text-fg-muted">
              <MousePointerClick size={28} className="text-fg-subtle" />
              <p>
                <span className="font-medium text-fg">Dê um duplo clique</span> no canvas para criar um estado.
              </p>
              <p className="text-xs text-fg-subtle">Arraste a alça de um estado até outro para criar transições.</p>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
