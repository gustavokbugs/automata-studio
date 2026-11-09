import { describe, expect, it } from 'vitest';
import {
  addState,
  addSymbol,
  addTransitions,
  emptyDefinition,
  moveState,
  nextStateName,
  removeState,
  removeSymbol,
  removeTransition,
  renameState,
  setEdgeSymbols,
  setFinalState,
  setInitialState,
  setType,
  updateTransition,
  type EditableAutomaton,
} from './operations';
import { autoLayout, completeLayout, nextFreePosition } from './layout';

const base: EditableAutomaton = {
  definition: {
    type: 'AFD',
    states: ['q0', 'q1'],
    alphabet: ['a', 'b'],
    initialState: 'q0',
    finalStates: ['q1'],
    transitions: [
      { from: 'q0', symbol: 'a', to: 'q1' },
      { from: 'q1', symbol: 'b', to: 'q0' },
      { from: 'q1', symbol: 'a', to: 'q1' },
    ],
  },
  layout: { q0: { x: 0, y: 0 }, q1: { x: 180, y: 0 } },
};

describe('estados', () => {
  it('gera nomes livres no padrão qN', () => {
    expect(nextStateName(base.definition)).toBe('q2');
    expect(nextStateName(emptyDefinition('AFD'))).toBe('q0');
  });

  it('o primeiro estado criado torna-se inicial', () => {
    const result = addState({ definition: emptyDefinition('AFND'), layout: {} });
    expect(result.definition.states).toEqual(['q0']);
    expect(result.definition.initialState).toBe('q0');
    expect(result.layout.q0).toEqual({ x: 0, y: 0 });
  });

  it('não adiciona estados com nome repetido', () => {
    expect(addState(base, 'q1')).toBe(base);
  });

  it('posiciona novos estados à direita', () => {
    expect(addState(base).layout.q2).toEqual({ x: 360, y: 0 });
  });

  it('renomeia em cascata (q₀, F, δ e layout)', () => {
    const result = renameState(base, 'q1', 'qf');
    expect(result.definition.states).toEqual(['q0', 'qf']);
    expect(result.definition.finalStates).toEqual(['qf']);
    expect(result.definition.transitions).toEqual([
      { from: 'q0', symbol: 'a', to: 'qf' },
      { from: 'qf', symbol: 'b', to: 'q0' },
      { from: 'qf', symbol: 'a', to: 'qf' },
    ]);
    expect(result.layout).toEqual({ q0: { x: 0, y: 0 }, qf: { x: 180, y: 0 } });
    expect(renameState(base, 'q0', 'start').definition.initialState).toBe('start');
  });

  it('não renomeia para um nome já existente', () => {
    expect(renameState(base, 'q0', 'q1')).toBe(base);
  });

  it('remove estado, suas transições e referências', () => {
    const result = removeState(base, 'q0');
    expect(result.definition.states).toEqual(['q1']);
    expect(result.definition.initialState).toBeNull();
    expect(result.definition.transitions).toEqual([{ from: 'q1', symbol: 'a', to: 'q1' }]);
    expect(result.layout).toEqual({ q1: { x: 180, y: 0 } });
  });

  it('define estado inicial e finais', () => {
    expect(setInitialState(base, 'q1').definition.initialState).toBe('q1');
    expect(setFinalState(base, 'q0', true).definition.finalStates).toEqual(['q1', 'q0']);
    expect(setFinalState(base, 'q1', false).definition.finalStates).toEqual([]);
  });

  it('mover um estado altera apenas o layout', () => {
    const result = moveState(base, 'q0', { x: 50, y: 70 });
    expect(result.definition).toBe(base.definition);
    expect(result.layout.q0).toEqual({ x: 50, y: 70 });
  });

  it('não muta o objeto original', () => {
    const snapshot = structuredClone(base);
    renameState(removeState(addState(base), 'q1'), 'q0', 'z');
    expect(base).toEqual(snapshot);
  });
});

describe('alfabeto', () => {
  it('adiciona símbolos sem duplicar', () => {
    expect(addSymbol(base, 'c').definition.alphabet).toEqual(['a', 'b', 'c']);
    expect(addSymbol(base, 'a')).toBe(base);
  });

  it('remover um símbolo remove as transições que o usam', () => {
    const result = removeSymbol(base, 'a');
    expect(result.definition.alphabet).toEqual(['b']);
    expect(result.definition.transitions).toEqual([{ from: 'q1', symbol: 'b', to: 'q0' }]);
  });
});

describe('transições', () => {
  it('adiciona transições ignorando repetidas', () => {
    const result = addTransitions(base, [
      { from: 'q0', symbol: 'a', to: 'q1' },
      { from: 'q0', symbol: 'b', to: 'q0' },
    ]);
    expect(result.definition.transitions).toHaveLength(4);
  });

  it('atualiza e remove por índice', () => {
    const updated = updateTransition(base, 0, { from: 'q0', symbol: 'b', to: 'q0' });
    expect(updated.definition.transitions[0]).toEqual({ from: 'q0', symbol: 'b', to: 'q0' });
    expect(removeTransition(base, 1).definition.transitions).toHaveLength(2);
  });

  it('redefine os símbolos de uma aresta preservando a ordem', () => {
    const result = setEdgeSymbols(base, 'q0', 'q1', ['a', 'b']);
    expect(result.definition.transitions.slice(0, 2)).toEqual([
      { from: 'q0', symbol: 'a', to: 'q1' },
      { from: 'q0', symbol: 'b', to: 'q1' },
    ]);
    expect(setEdgeSymbols(base, 'q0', 'q1', []).definition.transitions).toHaveLength(2);
  });

  it('altera o tipo sem modificar as transições', () => {
    const result = setType(base, 'AFND');
    expect(result.definition.type).toBe('AFND');
    expect(result.definition.transitions).toBe(base.definition.transitions);
  });
});

describe('layout automático', () => {
  it('posiciona até 4 estados em linha', () => {
    expect(autoLayout(['a', 'b'])).toEqual({ a: { x: 0, y: 0 }, b: { x: 180, y: 0 } });
  });

  it('posiciona muitos estados em círculo sem sobreposição', () => {
    const layout = autoLayout(['a', 'b', 'c', 'd', 'e', 'f']);
    const points = Object.values(layout);
    expect(points).toHaveLength(6);
    expect(new Set(points.map((p) => `${p.x},${p.y}`)).size).toBe(6);
  });

  it('completa layouts parciais', () => {
    const result = completeLayout(['a', 'b'], { a: { x: 10, y: 10 } });
    expect(result.a).toEqual({ x: 10, y: 10 });
    expect(result.b).toEqual({ x: 0, y: 190 });
  });

  it('sugere posição livre', () => {
    expect(nextFreePosition({})).toEqual({ x: 0, y: 0 });
    expect(nextFreePosition({ a: { x: 100, y: 40 } })).toEqual({ x: 280, y: 40 });
  });
});
