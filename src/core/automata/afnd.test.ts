import { describe, expect, it } from 'vitest';
import { closure, nfaMove, nfaTransitions, runNfa } from './afnd';
import type { AutomatonDefinition } from './types';

/**
 * AFND que reconhece sentenças binárias contendo "01":
 *   q0 --0,1--> q0, q0 --0--> q1, q1 --1--> q2, q2 --0,1--> q2.
 */
const contains01: AutomatonDefinition = {
  type: 'AFND',
  states: ['q0', 'q1', 'q2'],
  alphabet: ['0', '1'],
  initialState: 'q0',
  finalStates: ['q2'],
  transitions: [
    { from: 'q0', symbol: '0', to: 'q0' },
    { from: 'q0', symbol: '1', to: 'q0' },
    { from: 'q0', symbol: '0', to: 'q1' },
    { from: 'q1', symbol: '1', to: 'q2' },
    { from: 'q2', symbol: '0', to: 'q2' },
    { from: 'q2', symbol: '1', to: 'q2' },
  ],
};

/** AFND que aceita exatamente "ab" ou "ac", com ramos que morrem. */
const abOrAc: AutomatonDefinition = {
  type: 'AFND',
  states: ['s', 'x', 'y', 'f'],
  alphabet: ['a', 'b', 'c'],
  initialState: 's',
  finalStates: ['f'],
  transitions: [
    { from: 's', symbol: 'a', to: 'x' },
    { from: 's', symbol: 'a', to: 'y' },
    { from: 'x', symbol: 'b', to: 'f' },
    { from: 'y', symbol: 'c', to: 'f' },
  ],
};

describe('nfaTransitions', () => {
  it('retorna todos os destinos de δ(q, a)', () => {
    expect(nfaTransitions(contains01, 'q0', '0').map((t) => t.to)).toEqual(['q0', 'q1']);
  });

  it('retorna conjunto vazio quando δ(q, a) = ∅', () => {
    expect(nfaTransitions(contains01, 'q1', '0')).toEqual([]);
  });

  it('ignora triplas duplicadas', () => {
    const dup: AutomatonDefinition = {
      ...contains01,
      transitions: [...contains01.transitions, { from: 'q0', symbol: '0', to: 'q1' }],
    };
    expect(nfaTransitions(dup, 'q0', '0')).toHaveLength(2);
  });
});

describe('nfaMove', () => {
  it('une os destinos de todos os estados ativos', () => {
    const move = nfaMove(contains01, ['q0', 'q1'], '1');
    expect([...move.next].sort()).toEqual(['q0', 'q2']);
    expect(move.discarded).toEqual([]);
  });

  it('identifica os estados (caminhos) descartados', () => {
    const move = nfaMove(contains01, ['q0', 'q1'], '0');
    expect([...move.next].sort()).toEqual(['q0', 'q1']);
    expect(move.discarded).toEqual(['q1']);
  });
});

describe('closure', () => {
  it('é a identidade enquanto não há transições ε', () => {
    expect([...closure(contains01, new Set(['q0', 'q2']))]).toEqual(['q0', 'q2']);
  });
});

describe('runNfa — múltiplos estados ativos', () => {
  it('mantém vários estados ativos simultaneamente', () => {
    const result = runNfa(contains01, '00');
    expect(result.activeSets).toEqual([['q0'], ['q0', 'q1'], ['q0', 'q1']]);
    expect(result.steps[1]?.transitions).toHaveLength(2);
  });

  it('não é simulado como AFD: segue todos os ramos de δ(q, a)', () => {
    const result = runNfa(abOrAc, 'a');
    expect(result.steps[1]?.activeStates).toEqual(['x', 'y']);
  });

  it('registra caminhos descartados em cada etapa', () => {
    const result = runNfa(abOrAc, 'ab');
    expect(result.steps[2]).toMatchObject({
      previousStates: ['x', 'y'],
      activeStates: ['f'],
      discardedStates: ['y'],
    });
  });

  it('não fornece caminho único (path) para AFND', () => {
    expect(runNfa(contains01, '01').path).toBeNull();
  });
});

describe('runNfa — aceitação', () => {
  it.each(['01', '001', '1101', '0110', '1111010'])('aceita "%s" (contém 01)', (input) => {
    const result = runNfa(contains01, input);
    expect(result.accepted).toBe(true);
    expect(result.reason).toBe('accepted');
  });

  it('aceita quando ao menos um caminho termina em estado final', () => {
    const result = runNfa(contains01, '010');
    expect(result.finalActiveStates).toEqual(['q0', 'q1', 'q2']);
    expect(result.accepted).toBe(true);
  });

  it('aceita "ac" mesmo que o ramo por x tenha morrido', () => {
    expect(runNfa(abOrAc, 'ac').accepted).toBe(true);
  });
});

describe('runNfa — rejeição', () => {
  it.each(['0', '1', '10', '110', '1110000'])('rejeita "%s" (não contém 01)', (input) => {
    const result = runNfa(contains01, input);
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('not-final');
  });

  it('rejeita quando nenhum caminho termina em estado final', () => {
    const result = runNfa(contains01, '100');
    expect(result.finalActiveStates).toEqual(['q0', 'q1']);
    expect(result.accepted).toBe(false);
  });

  it('rejeita quando o conjunto de estados ativos fica vazio', () => {
    const result = runNfa(abOrAc, 'abc');
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('empty-active-set');
    expect(result.processedSymbols).toBe(2);
    expect(result.steps.at(-1)).toMatchObject({ activeStates: [], discardedStates: ['f'], status: 'rejected' });
  });

  it('rejeita símbolos fora do alfabeto', () => {
    const result = runNfa(contains01, '0a1');
    expect(result.reason).toBe('invalid-symbol');
    expect(result.processedSymbols).toBe(1);
  });
});

describe('runNfa — sentença vazia', () => {
  it('rejeita ε quando o estado inicial não é final', () => {
    const result = runNfa(contains01, '');
    expect(result.accepted).toBe(false);
    expect(result.steps).toHaveLength(1);
  });

  it('aceita ε quando o estado inicial é final', () => {
    const result = runNfa({ ...contains01, finalStates: ['q0'] }, '');
    expect(result.accepted).toBe(true);
    expect(result.steps[0]?.status).toBe('accepted');
  });
});
