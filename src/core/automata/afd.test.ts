import { describe, expect, it } from 'vitest';
import { dfaTransition, runDfa } from './afd';
import type { AutomatonDefinition } from './types';

/** AFD que aceita sentenças binárias com quantidade par de zeros. */
const evenZeros: AutomatonDefinition = {
  type: 'AFD',
  states: ['q0', 'q1'],
  alphabet: ['0', '1'],
  initialState: 'q0',
  finalStates: ['q0'],
  transitions: [
    { from: 'q0', symbol: '0', to: 'q1' },
    { from: 'q0', symbol: '1', to: 'q0' },
    { from: 'q1', symbol: '0', to: 'q0' },
    { from: 'q1', symbol: '1', to: 'q1' },
  ],
};

/** AFD parcial: aceita apenas a sentença "ab". */
const onlyAb: AutomatonDefinition = {
  type: 'AFD',
  states: ['s', 'a', 'f'],
  alphabet: ['a', 'b'],
  initialState: 's',
  finalStates: ['f'],
  transitions: [
    { from: 's', symbol: 'a', to: 'a' },
    { from: 'a', symbol: 'b', to: 'f' },
  ],
};

describe('dfaTransition', () => {
  it('retorna a transição definida para o par (q, a)', () => {
    expect(dfaTransition(evenZeros, 'q0', '0')).toEqual({ from: 'q0', symbol: '0', to: 'q1' });
  });

  it('retorna null quando δ(q, a) é indefinida', () => {
    expect(dfaTransition(onlyAb, 's', 'b')).toBeNull();
  });
});

describe('runDfa — aceitação', () => {
  it.each(['1', '00', '1001', '0101', '111', '000000'])('aceita "%s" (zeros em quantidade par)', (input) => {
    const result = runDfa(evenZeros, input);
    expect(result.accepted).toBe(true);
    expect(result.reason).toBe('accepted');
  });

  it('registra o caminho percorrido q₀ → … → qₙ', () => {
    const result = runDfa(evenZeros, '0110');
    expect(result.path).toEqual(['q0', 'q1', 'q1', 'q1', 'q0']);
    expect(result.processedSymbols).toBe(4);
    expect(result.steps).toHaveLength(5);
  });

  it('cada etapa consome exatamente um símbolo e registra a transição', () => {
    const result = runDfa(evenZeros, '01');
    const [initial, first, second] = result.steps;
    expect(initial).toMatchObject({ index: 0, consumed: 0, symbol: null, activeStates: ['q0'], status: 'running' });
    expect(first).toMatchObject({
      index: 1,
      consumed: 1,
      symbol: '0',
      previousStates: ['q0'],
      activeStates: ['q1'],
      transitions: [{ from: 'q0', symbol: '0', to: 'q1' }],
      status: 'running',
    });
    expect(second).toMatchObject({ index: 2, consumed: 2, symbol: '1', activeStates: ['q1'], status: 'rejected' });
  });
});

describe('runDfa — rejeição', () => {
  it.each(['0', '10', '000', '0111'])('rejeita "%s" (zeros em quantidade ímpar)', (input) => {
    const result = runDfa(evenZeros, input);
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('not-final');
    expect(result.finalActiveStates).toEqual(['q1']);
  });

  it('rejeita quando não existe transição válida e interrompe a leitura', () => {
    const result = runDfa(onlyAb, 'abb');
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('no-transition');
    expect(result.processedSymbols).toBe(2);
    expect(result.steps.at(-1)).toMatchObject({ symbol: 'b', activeStates: [], discardedStates: ['f'], status: 'rejected' });
  });

  it('não lê o restante da sentença após uma rejeição', () => {
    const result = runDfa(onlyAb, 'ba');
    expect(result.steps).toHaveLength(2);
    expect(result.path).toEqual(['s']);
  });
});

describe('runDfa — sentença vazia', () => {
  it('aceita ε quando o estado inicial é final', () => {
    const result = runDfa(evenZeros, '');
    expect(result.accepted).toBe(true);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0]?.status).toBe('accepted');
    expect(result.processedSymbols).toBe(0);
  });

  it('rejeita ε quando o estado inicial não é final', () => {
    const result = runDfa(onlyAb, '');
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('not-final');
    expect(result.steps[0]?.status).toBe('rejected');
  });
});

describe('runDfa — símbolos inválidos', () => {
  it('rejeita sentenças com símbolos fora do alfabeto', () => {
    const result = runDfa(evenZeros, '0120');
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('invalid-symbol');
    expect(result.processedSymbols).toBe(2);
    expect(result.steps.at(-1)).toMatchObject({ symbol: '2', position: 2, status: 'rejected' });
    expect(result.summary).toContain("'2'");
  });

  it('identifica símbolo inválido logo na primeira posição', () => {
    const result = runDfa(evenZeros, 'x');
    expect(result.reason).toBe('invalid-symbol');
    expect(result.processedSymbols).toBe(0);
  });
});

describe('runDfa — pré-condições', () => {
  it('lança erro quando não há estado inicial', () => {
    expect(() => runDfa({ ...evenZeros, initialState: null }, '0')).toThrow(/estado inicial/);
  });
});
