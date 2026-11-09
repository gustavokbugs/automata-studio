import { describe, expect, it } from 'vitest';
import {
  hasErrors,
  isValidStateName,
  isValidSymbol,
  reachableStates,
  validateAutomaton,
  validateSentence,
} from './validation';
import type { AutomatonDefinition, ValidationCode } from './types';

const valid: AutomatonDefinition = {
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

const codes = (def: AutomatonDefinition): ValidationCode[] => validateAutomaton(def).map((i) => i.code);

describe('validateAutomaton', () => {
  it('não encontra problemas em uma definição completa e correta', () => {
    expect(validateAutomaton(valid)).toEqual([]);
  });

  it('detecta conjunto de estados vazio', () => {
    expect(codes({ ...valid, states: [], initialState: null, finalStates: [], transitions: [] })).toContain(
      'EMPTY_STATES',
    );
  });

  it('detecta alfabeto vazio', () => {
    expect(codes({ ...valid, alphabet: [], transitions: [] })).toContain('EMPTY_ALPHABET');
  });

  it('detecta ausência de estado inicial', () => {
    expect(codes({ ...valid, initialState: null })).toContain('MISSING_INITIAL_STATE');
  });

  it('detecta estado inicial inexistente', () => {
    expect(codes({ ...valid, initialState: 'q9' })).toContain('UNKNOWN_INITIAL_STATE');
  });

  it('detecta estados finais inexistentes', () => {
    const issues = validateAutomaton({ ...valid, finalStates: ['q0', 'qx'] });
    const issue = issues.find((i) => i.code === 'UNKNOWN_FINAL_STATE');
    expect(issue?.severity).toBe('error');
    expect(issue?.states).toEqual(['qx']);
  });

  it('detecta estados com nomes duplicados', () => {
    expect(codes({ ...valid, states: ['q0', 'q1', 'q0'] })).toContain('DUPLICATE_STATE');
  });

  it('detecta nomes de estado inválidos', () => {
    expect(codes({ ...valid, states: ['q0', 'q1', 'q 2'] })).toContain('INVALID_STATE_NAME');
  });

  it('detecta símbolos inválidos e duplicados no alfabeto', () => {
    const result = codes({ ...valid, alphabet: ['0', '1', '1', 'ab'] });
    expect(result).toContain('INVALID_SYMBOL');
    expect(result).toContain('DUPLICATE_SYMBOL');
  });

  it('detecta transições apontando para estados inexistentes', () => {
    const issues = validateAutomaton({
      ...valid,
      transitions: [...valid.transitions, { from: 'q1', symbol: '1', to: 'q7' }],
    });
    const issue = issues.find((i) => i.code === 'UNKNOWN_TRANSITION_TARGET');
    expect(issue?.transitionIndexes).toEqual([4]);
  });

  it('detecta transições partindo de estados inexistentes', () => {
    expect(codes({ ...valid, transitions: [...valid.transitions, { from: 'qz', symbol: '0', to: 'q0' }] })).toContain(
      'UNKNOWN_TRANSITION_SOURCE',
    );
  });

  it('detecta símbolos de transição fora do alfabeto', () => {
    expect(codes({ ...valid, transitions: [...valid.transitions, { from: 'q0', symbol: '2', to: 'q0' }] })).toContain(
      'SYMBOL_NOT_IN_ALPHABET',
    );
  });

  it('detecta transições duplicadas', () => {
    const issues = validateAutomaton({ ...valid, transitions: [...valid.transitions, { from: 'q0', symbol: '0', to: 'q1' }] });
    const issue = issues.find((i) => i.code === 'DUPLICATE_TRANSITION');
    expect(issue?.transitionIndexes).toEqual([0, 4]);
  });

  it('detecta AFD com mais de um destino para o mesmo par estado/símbolo', () => {
    const issues = validateAutomaton({
      ...valid,
      transitions: [...valid.transitions, { from: 'q0', symbol: '0', to: 'q0' }],
    });
    const issue = issues.find((i) => i.code === 'NONDETERMINISTIC_TRANSITION');
    expect(issue?.severity).toBe('error');
    expect(issue?.transitionIndexes).toEqual([0, 4]);
  });

  it('permite vários destinos para o mesmo par em um AFND', () => {
    const result = codes({
      ...valid,
      type: 'AFND',
      transitions: [...valid.transitions, { from: 'q0', symbol: '0', to: 'q0' }],
    });
    expect(result).not.toContain('NONDETERMINISTIC_TRANSITION');
    expect(result).toEqual([]);
  });

  it('avisa (sem bloquear) quando o AFD é parcial', () => {
    const issues = validateAutomaton({ ...valid, transitions: valid.transitions.slice(0, 3) });
    const issue = issues.find((i) => i.code === 'INCOMPLETE_DFA');
    expect(issue?.severity).toBe('warning');
    expect(issue?.message).toContain('δ(q1, 1)');
    expect(hasErrors(issues)).toBe(false);
  });

  it('avisa quando F = ∅', () => {
    const issues = validateAutomaton({ ...valid, finalStates: [] });
    expect(issues.map((i) => i.code)).toEqual(['NO_FINAL_STATES']);
    expect(hasErrors(issues)).toBe(false);
  });

  it('avisa sobre estados inalcançáveis', () => {
    const issues = validateAutomaton({
      ...valid,
      type: 'AFND',
      states: [...valid.states, 'q2'],
    });
    const issue = issues.find((i) => i.code === 'UNREACHABLE_STATE');
    expect(issue?.states).toEqual(['q2']);
  });

  it('acumula vários problemas em uma especificação incompleta', () => {
    const issues = validateAutomaton({
      type: 'AFD',
      states: [],
      alphabet: [],
      initialState: null,
      finalStates: [],
      transitions: [],
    });
    expect(issues.map((i) => i.code)).toEqual(['EMPTY_STATES', 'EMPTY_ALPHABET', 'MISSING_INITIAL_STATE']);
    expect(hasErrors(issues)).toBe(true);
  });
});

describe('regras auxiliares', () => {
  it('isValidStateName', () => {
    expect(isValidStateName('q0')).toBe(true);
    expect(isValidStateName('')).toBe(false);
    expect(isValidStateName('q 0')).toBe(false);
    expect(isValidStateName('q,0')).toBe(false);
  });

  it('isValidSymbol', () => {
    expect(isValidSymbol('a')).toBe(true);
    expect(isValidSymbol('ab')).toBe(false);
    expect(isValidSymbol(' ')).toBe(false);
    expect(isValidSymbol('ε')).toBe(false);
  });

  it('reachableStates', () => {
    expect([...reachableStates(valid)]).toEqual(['q0', 'q1']);
    expect(reachableStates({ ...valid, initialState: null }).size).toBe(0);
  });
});

describe('validateSentence', () => {
  it('aceita a sentença vazia', () => {
    expect(validateSentence(valid, '')).toEqual([]);
  });

  it('aponta a posição de cada símbolo fora do alfabeto', () => {
    const issues = validateSentence(valid, '01a1 ');
    expect(issues.map((i) => [i.position, i.symbol])).toEqual([
      [2, 'a'],
      [4, ' '],
    ]);
    expect(issues[1]?.message).toMatch(/Espaço/);
  });
});
