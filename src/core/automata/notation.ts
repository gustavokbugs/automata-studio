import type { AlphabetSymbol, AutomatonDefinition, StateName } from './types';

/** Símbolo usado para representar a sentença vazia. */
export const EPSILON = 'ε';

/** Símbolo usado para representar o conjunto vazio. */
export const EMPTY_SET = '∅';

/**
 * Decompõe uma sentença em símbolos. Cada símbolo do alfabeto possui
 * exatamente um caractere, portanto a sentença é lida caractere a caractere
 * (com suporte a caracteres Unicode fora do plano básico).
 */
export function splitSentence(input: string): AlphabetSymbol[] {
  return Array.from(input);
}

/** Formata um conjunto de estados: `{q0, q1}` ou `∅`. */
export function formatStateSet(states: readonly StateName[]): string {
  return states.length === 0 ? EMPTY_SET : `{${states.join(', ')}}`;
}

/** Formata uma sentença, exibindo `ε` quando vazia. */
export function formatSentence(input: string): string {
  return input.length === 0 ? EPSILON : input;
}

/**
 * Ordena um conjunto de estados segundo a ordem de declaração em Q,
 * garantindo saídas determinísticas e legíveis.
 */
export function sortStates(
  definition: Pick<AutomatonDefinition, 'states'>,
  states: Iterable<StateName>,
): StateName[] {
  const order = new Map(definition.states.map((name, index) => [name, index]));
  return [...new Set(states)].sort(
    (a, b) => (order.get(a) ?? Number.MAX_SAFE_INTEGER) - (order.get(b) ?? Number.MAX_SAFE_INTEGER),
  );
}
