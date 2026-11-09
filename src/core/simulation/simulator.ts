import { runDfa } from '../automata/afd';
import { runNfa } from '../automata/afnd';
import { splitSentence } from '../automata/notation';
import { hasErrors, validateAutomaton } from '../automata/validation';
import type { AutomatonDefinition, ValidationIssue } from '../automata/types';
import type { ExecutionResult } from './types';

/** Resultado de `simulate`: o trace da execução e os problemas de validação. */
export interface SimulationOutcome {
  result: ExecutionResult;
  issues: ValidationIssue[];
}

/**
 * Ponto de entrada único para a simulação.
 *
 * 1. Valida a definição formal. Se houver erros, nenhuma computação é feita
 *    e o resultado indica `invalid-automaton`.
 * 2. Despacha para o algoritmo adequado ao tipo do autômato:
 *    AFD → `runDfa` (um único estado ativo);
 *    AFND → `runNfa` (conjunto de estados ativos).
 */
export function simulate(definition: AutomatonDefinition, input: string): SimulationOutcome {
  const issues = validateAutomaton(definition);

  if (hasErrors(issues)) {
    const errorCount = issues.filter((i) => i.severity === 'error').length;
    return {
      issues,
      result: {
        type: definition.type,
        input,
        symbols: splitSentence(input),
        steps: [],
        accepted: false,
        reason: 'invalid-automaton',
        processedSymbols: 0,
        finalActiveStates: [],
        path: definition.type === 'AFD' ? [] : null,
        activeSets: [],
        summary: `O autômato possui ${errorCount} erro(s) de especificação e não pode ser simulado.`,
      },
    };
  }

  const result = definition.type === 'AFD' ? runDfa(definition, input) : runNfa(definition, input);
  return { result, issues };
}

/** Atalho: indica se a sentença é aceita pelo autômato. */
export function accepts(definition: AutomatonDefinition, input: string): boolean {
  return simulate(definition, input).result.accepted;
}
