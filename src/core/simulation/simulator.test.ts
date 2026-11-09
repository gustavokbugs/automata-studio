import { describe, expect, it } from 'vitest';
import { accepts, simulate } from './simulator';
import { clampStep, countComputationSteps, getStep, getTapeView, isLastStep } from './execution';
import type { AutomatonDefinition } from '../automata/types';

const dfa: AutomatonDefinition = {
  type: 'AFD',
  states: ['q0', 'q1'],
  alphabet: ['a'],
  initialState: 'q0',
  finalStates: ['q1'],
  transitions: [
    { from: 'q0', symbol: 'a', to: 'q1' },
    { from: 'q1', symbol: 'a', to: 'q0' },
  ],
};

describe('simulate', () => {
  it('despacha para o AFD conforme o tipo', () => {
    const { result, issues } = simulate(dfa, 'aaa');
    expect(issues).toEqual([]);
    expect(result.type).toBe('AFD');
    expect(result.path).toEqual(['q0', 'q1', 'q0', 'q1']);
    expect(result.accepted).toBe(true);
  });

  it('despacha para o AFND conforme o tipo', () => {
    const { result } = simulate({ ...dfa, type: 'AFND' }, 'aa');
    expect(result.type).toBe('AFND');
    expect(result.path).toBeNull();
    expect(result.activeSets).toEqual([['q0'], ['q1'], ['q0']]);
  });

  it('não simula autômatos com erros de especificação', () => {
    const { result, issues } = simulate({ ...dfa, initialState: null }, 'a');
    expect(result.reason).toBe('invalid-automaton');
    expect(result.steps).toEqual([]);
    expect(issues.some((i) => i.code === 'MISSING_INITIAL_STATE')).toBe(true);
  });

  it('simula autômatos que possuem apenas avisos', () => {
    const partial = { ...dfa, transitions: dfa.transitions.slice(0, 1) };
    const { result, issues } = simulate(partial, 'aa');
    expect(issues.map((i) => i.code)).toEqual(['INCOMPLETE_DFA']);
    expect(result.reason).toBe('no-transition');
  });

  it('accepts é um atalho para o veredito', () => {
    expect(accepts(dfa, 'a')).toBe(true);
    expect(accepts(dfa, '')).toBe(false);
  });
});

describe('navegação pelo trace', () => {
  const { result } = simulate(dfa, 'aaa');

  it('limita índices ao intervalo de etapas', () => {
    expect(clampStep(result, -5)).toBe(0);
    expect(clampStep(result, 99)).toBe(3);
    expect(getStep(result, 99)?.index).toBe(3);
  });

  it('identifica a última etapa', () => {
    expect(isLastStep(result, 2)).toBe(false);
    expect(isLastStep(result, 3)).toBe(true);
  });

  it('conta apenas etapas de computação', () => {
    expect(countComputationSteps(result)).toBe(3);
  });

  it('decompõe a fita em lidos, corrente e restantes', () => {
    expect(getTapeView(result, 0)).toEqual({ processed: [], current: null, remaining: ['a', 'a', 'a'], headPosition: null });
    expect(getTapeView(result, 2)).toEqual({ processed: ['a'], current: 'a', remaining: ['a'], headPosition: 1 });
  });
});
