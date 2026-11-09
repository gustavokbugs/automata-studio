import type { AlphabetSymbol } from '../automata/types';
import type { ExecutionResult, ExecutionStep } from './types';

/**
 * Funções puras para navegar pelo trace de uma execução. A interface mantém
 * apenas um índice de etapa; todo o restante é derivado daqui.
 */

/** Limita um índice de etapa ao intervalo válido do trace. */
export function clampStep(result: ExecutionResult, index: number): number {
  if (result.steps.length === 0) return 0;
  return Math.min(Math.max(index, 0), result.steps.length - 1);
}

/** Retorna a etapa no índice informado (limitado ao intervalo válido). */
export function getStep(result: ExecutionResult, index: number): ExecutionStep | null {
  return result.steps[clampStep(result, index)] ?? null;
}

/** Indica se o índice corresponde à última etapa do trace. */
export function isLastStep(result: ExecutionResult, index: number): boolean {
  return result.steps.length > 0 && index >= result.steps.length - 1;
}

/** Visão da fita de entrada em uma etapa. */
export interface TapeView {
  /** Símbolos já lidos antes do símbolo corrente. */
  processed: AlphabetSymbol[];
  /** Símbolo lido nesta etapa (ou `null` na etapa 0). */
  current: AlphabetSymbol | null;
  /** Símbolos ainda não processados. */
  remaining: AlphabetSymbol[];
  /** Posição do símbolo corrente na fita (ou `null`). */
  headPosition: number | null;
}

/** Decompõe a fita em: já lidos, símbolo corrente e restantes. */
export function getTapeView(result: ExecutionResult, index: number): TapeView {
  const step = getStep(result, index);
  const position = step?.position ?? null;

  if (position === null) {
    return { processed: [], current: null, remaining: [...result.symbols], headPosition: null };
  }

  return {
    processed: result.symbols.slice(0, position),
    current: result.symbols[position] ?? null,
    remaining: result.symbols.slice(position + 1),
    headPosition: position,
  };
}

/** Quantidade de etapas de computação (exclui a configuração inicial). */
export function countComputationSteps(result: ExecutionResult): number {
  return Math.max(result.steps.length - 1, 0);
}
