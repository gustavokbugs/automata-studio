import { describe, expect, it } from 'vitest';
import { buildEdges, buildNodes, edgeId, mergeNodes } from './flowElements';
import { validateAutomaton } from '../../core/automata/validation';
import type { AutomatonProject } from '../../core/automata/types';
import type { SimulationHighlight } from '../../hooks/useSimulationHighlight';

const project: AutomatonProject = {
  id: 'p',
  name: 'Teste',
  description: '',
  createdAt: '',
  updatedAt: '',
  definition: {
    type: 'AFND',
    states: ['q0', 'q1'],
    alphabet: ['0', '1'],
    initialState: 'q0',
    finalStates: ['q1'],
    transitions: [
      { from: 'q0', symbol: '0', to: 'q0' },
      { from: 'q0', symbol: '1', to: 'q0' },
      { from: 'q0', symbol: '0', to: 'q1' },
      { from: 'q1', symbol: '1', to: 'q0' },
      { from: 'q1', symbol: 'x', to: 'q0' },
    ],
  },
  layout: { q0: { x: 0, y: 0 }, q1: { x: 200, y: 0 } },
};

const issues = validateAutomaton(project.definition);

describe('buildNodes', () => {
  it('marca estado inicial, finais e seleção', () => {
    const nodes = buildNodes(project, issues, null, { kind: 'state', name: 'q1' });
    expect(nodes.map((n) => [n.id, n.data.initial, n.data.final, n.selected])).toEqual([
      ['q0', true, false, false],
      ['q1', false, true, true],
    ]);
  });

  it('destaca estados ativos, aceitos e descartados', () => {
    const highlight: SimulationHighlight = {
      active: new Set(['q0', 'q1']),
      discarded: new Set(),
      transitions: [],
      status: 'accepted',
    };
    expect(buildNodes(project, issues, highlight, null).map((n) => n.data.visual)).toEqual(['active', 'accepted']);
    const rejected: SimulationHighlight = { ...highlight, active: new Set(), discarded: new Set(['q1']), status: 'rejected' };
    expect(buildNodes(project, issues, rejected, null).map((n) => n.data.visual)).toEqual(['idle', 'discarded']);
  });
});

describe('buildEdges', () => {
  it('agrupa transições do mesmo par em uma aresta com vários símbolos', () => {
    const edges = buildEdges(project, issues, null, null);
    const loop = edges.find((e) => e.id === edgeId('q0', 'q0'));
    expect(loop?.data?.symbols).toEqual(['0', '1']);
    expect(edges).toHaveLength(3);
  });

  it('curva arestas bidirecionais', () => {
    const edges = buildEdges(project, issues, null, null);
    expect(edges.find((e) => e.id === edgeId('q0', 'q1'))?.data?.curved).toBe(true);
    expect(edges.find((e) => e.id === edgeId('q0', 'q0'))?.data?.curved).toBe(false);
  });

  it('destaca transições inválidas', () => {
    const edge = buildEdges(project, issues, null, null).find((e) => e.id === edgeId('q1', 'q0'));
    expect(edge?.data?.visual).toBe('invalid');
    expect(edge?.data?.invalidSymbols).toEqual(['x']);
  });

  it('destaca as transições percorridas na etapa', () => {
    const highlight: SimulationHighlight = {
      active: new Set(['q0', 'q1']),
      discarded: new Set(),
      transitions: [
        { from: 'q0', symbol: '0', to: 'q0' },
        { from: 'q0', symbol: '0', to: 'q1' },
      ],
      status: 'running',
    };
    const edges = buildEdges(project, issues, highlight, null);
    expect(edges.filter((e) => e.data?.visual === 'active').map((e) => e.id)).toEqual([
      edgeId('q0', 'q0'),
      edgeId('q0', 'q1'),
    ]);
  });
});

describe('mergeNodes', () => {
  it('preserva medidas e a posição de nós em arraste', () => {
    const [a, b] = buildNodes(project, issues, null, null);
    if (!a || !b) throw new Error('nós ausentes');
    const previous = [
      { ...a, measured: { width: 64, height: 64 }, dragging: true, position: { x: 50, y: 50 } },
      { ...b, measured: { width: 64, height: 64 } },
    ];
    const merged = mergeNodes(previous, [a, { ...b, position: { x: 300, y: 0 } }]);
    expect(merged[0]?.position).toEqual({ x: 50, y: 50 });
    expect(merged[1]?.position).toEqual({ x: 300, y: 0 });
    expect(merged[1]?.measured).toEqual({ width: 64, height: 64 });
  });
});
