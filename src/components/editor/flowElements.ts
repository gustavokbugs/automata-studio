import type { Edge, Node } from '@xyflow/react';
import type { AutomatonProject, StateName, ValidationIssue } from '../../core/automata/types';
import type { SimulationHighlight } from '../../hooks/useSimulationHighlight';
import type { Selection } from '../../stores/uiStore';

/**
 * Conversão da definição formal + layout em nós e arestas do React Flow.
 * Funções puras: o grafo é sempre uma projeção do modelo, nunca a fonte
 * da verdade.
 */

/** Aparência de um estado conforme a simulação. */
export type StateVisual = 'idle' | 'active' | 'accepted' | 'rejected' | 'discarded';

export type StateNodeData = {
  name: StateName;
  initial: boolean;
  final: boolean;
  visual: StateVisual;
  invalid: boolean;
};

export type StateFlowNode = Node<StateNodeData, 'state'>;

/** Aparência de uma aresta. */
export type EdgeVisual = 'idle' | 'active' | 'invalid';

export type TransitionEdgeData = {
  from: StateName;
  to: StateName;
  symbols: string[];
  /** Símbolos desta aresta percorridos na etapa corrente. */
  activeSymbols: string[];
  /** Símbolos de transições inválidas (ex.: fora de Σ, duplicadas). */
  invalidSymbols: string[];
  visual: EdgeVisual;
  curved: boolean;
};

export type TransitionFlowEdge = Edge<TransitionEdgeData, 'transition'>;

/** Identificador estável de uma aresta (par origem → destino). */
export const edgeId = (from: StateName, to: StateName) => JSON.stringify([from, to]);

function stateVisual(name: StateName, finals: ReadonlySet<StateName>, highlight: SimulationHighlight | null): StateVisual {
  if (!highlight) return 'idle';
  if (highlight.active.has(name)) {
    if (highlight.status === 'accepted') return finals.has(name) ? 'accepted' : 'active';
    if (highlight.status === 'rejected') return 'rejected';
    return 'active';
  }
  if (highlight.discarded.has(name)) return 'discarded';
  return 'idle';
}

export function buildNodes(
  project: AutomatonProject,
  issues: readonly ValidationIssue[],
  highlight: SimulationHighlight | null,
  selection: Selection,
): StateFlowNode[] {
  const { definition, layout } = project;
  const finals = new Set(definition.finalStates);
  const invalid = new Set(issues.filter((i) => i.severity === 'error').flatMap((i) => i.states ?? []));
  const seen = new Set<StateName>();

  return definition.states
    .filter((name) => {
      // Estados duplicados (erro de validação) são desenhados uma única vez.
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    })
    .map((name) => ({
      id: name,
      type: 'state' as const,
      position: layout[name] ?? { x: 0, y: 0 },
      selected: selection?.kind === 'state' && selection.name === name,
      data: {
        name,
        initial: definition.initialState === name,
        final: finals.has(name),
        visual: stateVisual(name, finals, highlight),
        invalid: invalid.has(name),
      },
    }));
}

export function buildEdges(
  project: AutomatonProject,
  issues: readonly ValidationIssue[],
  highlight: SimulationHighlight | null,
  selection: Selection,
): TransitionFlowEdge[] {
  const { definition } = project;
  const states = new Set(definition.states);
  const invalidIndexes = new Set(
    issues.filter((i) => i.severity === 'error').flatMap((i) => i.transitionIndexes ?? []),
  );

  const groups = new Map<string, TransitionEdgeData>();
  definition.transitions.forEach((t, index) => {
    // Transições para estados inexistentes não têm onde ser desenhadas:
    // aparecem destacadas na tabela de transições e na validação.
    if (!states.has(t.from) || !states.has(t.to)) return;
    const id = edgeId(t.from, t.to);
    const group =
      groups.get(id) ??
      ({ from: t.from, to: t.to, symbols: [], activeSymbols: [], invalidSymbols: [], visual: 'idle', curved: false } satisfies TransitionEdgeData);
    if (!group.symbols.includes(t.symbol)) group.symbols.push(t.symbol);
    if (invalidIndexes.has(index) && !group.invalidSymbols.includes(t.symbol)) group.invalidSymbols.push(t.symbol);
    groups.set(id, group);
  });

  for (const t of highlight?.transitions ?? []) {
    const group = groups.get(edgeId(t.from, t.to));
    if (group && !group.activeSymbols.includes(t.symbol)) group.activeSymbols.push(t.symbol);
  }

  return [...groups.entries()].map(([id, data]) => {
    data.curved = data.from !== data.to && groups.has(edgeId(data.to, data.from));
    data.visual = data.activeSymbols.length > 0 ? 'active' : data.invalidSymbols.length > 0 ? 'invalid' : 'idle';
    return {
      id,
      type: 'transition' as const,
      source: data.from,
      target: data.to,
      selected: selection?.kind === 'edge' && selection.from === data.from && selection.to === data.to,
      zIndex: data.visual === 'active' ? 10 : 0,
      data,
    };
  });
}

/**
 * Mescla os nós recém-gerados com os anteriores, preservando as medidas
 * internas do React Flow e a posição de nós que estão sendo arrastados.
 */
export function mergeNodes(previous: StateFlowNode[], next: StateFlowNode[]): StateFlowNode[] {
  const byId = new Map(previous.map((n) => [n.id, n]));
  return next.map((node) => {
    const old = byId.get(node.id);
    if (!old) return node;
    return {
      ...node,
      measured: old.measured,
      dragging: old.dragging,
      position: old.dragging ? old.position : node.position,
    };
  });
}
