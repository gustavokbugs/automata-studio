import { nextFreePosition } from './layout';
import type {
  AlphabetSymbol,
  AutomatonDefinition,
  AutomatonLayout,
  AutomatonType,
  Point,
  StateName,
  Transition,
} from './types';

/**
 * Operações puras de edição. Cada função recebe um autômato editável e
 * devolve uma nova versão, sem mutar a original. Mantêm a consistência
 * referencial (ex.: renomear um estado atualiza transições, q₀ e F).
 */
export interface EditableAutomaton {
  definition: AutomatonDefinition;
  layout: AutomatonLayout;
}

type Op<A extends unknown[]> = <T extends EditableAutomaton>(automaton: T, ...args: A) => T;

const withDefinition = <T extends EditableAutomaton>(
  automaton: T,
  patch: Partial<AutomatonDefinition>,
  layout: AutomatonLayout = automaton.layout,
): T => ({ ...automaton, definition: { ...automaton.definition, ...patch }, layout });

/** Cria uma definição vazia do tipo informado. */
export function emptyDefinition(type: AutomatonType): AutomatonDefinition {
  return { type, states: [], alphabet: [], initialState: null, finalStates: [], transitions: [] };
}

/** Gera o próximo nome livre no padrão q0, q1, q2… */
export function nextStateName(definition: AutomatonDefinition, prefix = 'q'): StateName {
  const used = new Set(definition.states);
  let i = 0;
  while (used.has(`${prefix}${i}`)) i++;
  return `${prefix}${i}`;
}

/** Igualdade estrutural entre transições. */
export function sameTransition(a: Transition, b: Transition): boolean {
  return a.from === b.from && a.symbol === b.symbol && a.to === b.to;
}

// ── Tipo ───────────────────────────────────────────────────────────────────

export const setType: Op<[type: AutomatonType]> = (automaton, type) => withDefinition(automaton, { type });

// ── Estados ────────────────────────────────────────────────────────────────

/**
 * Adiciona um estado. Se o nome já existir, nada é alterado. O primeiro
 * estado criado torna-se automaticamente o estado inicial.
 */
export const addState: Op<[name?: StateName, position?: Point]> = (automaton, name, position) => {
  const { definition, layout } = automaton;
  const stateName = name ?? nextStateName(definition);
  if (definition.states.includes(stateName)) return automaton;
  return withDefinition(
    automaton,
    {
      states: [...definition.states, stateName],
      initialState: definition.initialState ?? stateName,
    },
    { ...layout, [stateName]: position ?? nextFreePosition(layout) },
  );
};

/** Renomeia um estado, atualizando q₀, F, δ e o layout. */
export const renameState: Op<[from: StateName, to: StateName]> = (automaton, from, to) => {
  const { definition, layout } = automaton;
  if (from === to || !definition.states.includes(from) || definition.states.includes(to)) return automaton;
  const rename = (s: StateName) => (s === from ? to : s);
  const { [from]: position, ...rest } = layout;
  return withDefinition(
    automaton,
    {
      states: definition.states.map(rename),
      initialState: definition.initialState === from ? to : definition.initialState,
      finalStates: definition.finalStates.map(rename),
      transitions: definition.transitions.map((t) => ({ ...t, from: rename(t.from), to: rename(t.to) })),
    },
    position ? { ...rest, [to]: position } : rest,
  );
};

/** Remove um estado e todas as transições que o envolvem. */
export const removeState: Op<[name: StateName]> = (automaton, name) => {
  const { definition, layout } = automaton;
  const { [name]: _removed, ...rest } = layout;
  return withDefinition(
    automaton,
    {
      states: definition.states.filter((s) => s !== name),
      initialState: definition.initialState === name ? null : definition.initialState,
      finalStates: definition.finalStates.filter((s) => s !== name),
      transitions: definition.transitions.filter((t) => t.from !== name && t.to !== name),
    },
    rest,
  );
};

/** Define q₀ (ou remove, com `null`). */
export const setInitialState: Op<[name: StateName | null]> = (automaton, name) =>
  withDefinition(automaton, { initialState: name });

/** Inclui ou exclui um estado de F. */
export const setFinalState: Op<[name: StateName, final: boolean]> = (automaton, name, final) => {
  const others = automaton.definition.finalStates.filter((s) => s !== name);
  return withDefinition(automaton, { finalStates: final ? [...others, name] : others });
};

/** Atualiza a posição visual de um estado (não altera a definição formal). */
export const moveState: Op<[name: StateName, position: Point]> = (automaton, name, position) => ({
  ...automaton,
  layout: { ...automaton.layout, [name]: position },
});

// ── Alfabeto ───────────────────────────────────────────────────────────────

/** Adiciona um símbolo ao alfabeto (ignora duplicatas). */
export const addSymbol: Op<[symbol: AlphabetSymbol]> = (automaton, symbol) =>
  automaton.definition.alphabet.includes(symbol)
    ? automaton
    : withDefinition(automaton, { alphabet: [...automaton.definition.alphabet, symbol] });

/** Remove um símbolo do alfabeto e as transições que o utilizam. */
export const removeSymbol: Op<[symbol: AlphabetSymbol]> = (automaton, symbol) =>
  withDefinition(automaton, {
    alphabet: automaton.definition.alphabet.filter((s) => s !== symbol),
    transitions: automaton.definition.transitions.filter((t) => t.symbol !== symbol),
  });

// ── Transições ─────────────────────────────────────────────────────────────

/** Adiciona transições, ignorando as que já existem. */
export const addTransitions: Op<[transitions: Transition[]]> = (automaton, transitions) => {
  const next = [...automaton.definition.transitions];
  for (const t of transitions) {
    if (!next.some((existing) => sameTransition(existing, t))) next.push(t);
  }
  return withDefinition(automaton, { transitions: next });
};

/** Substitui a transição no índice informado. */
export const updateTransition: Op<[index: number, transition: Transition]> = (automaton, index, transition) =>
  withDefinition(automaton, {
    transitions: automaton.definition.transitions.map((t, i) => (i === index ? transition : t)),
  });

/** Remove a transição no índice informado. */
export const removeTransition: Op<[index: number]> = (automaton, index) =>
  withDefinition(automaton, {
    transitions: automaton.definition.transitions.filter((_, i) => i !== index),
  });

/**
 * Redefine os símbolos das transições entre dois estados (uma aresta do
 * grafo). Uma lista vazia remove a aresta.
 */
export const setEdgeSymbols: Op<[from: StateName, to: StateName, symbols: AlphabetSymbol[]]> = (
  automaton,
  from,
  to,
  symbols,
) => {
  const transitions = automaton.definition.transitions;
  const firstIndex = transitions.findIndex((t) => t.from === from && t.to === to);
  const others = transitions.filter((t) => !(t.from === from && t.to === to));
  const edge = [...new Set(symbols)].map((symbol) => ({ from, symbol, to }));
  const insertAt = firstIndex === -1 ? others.length : firstIndex;
  return withDefinition(automaton, {
    transitions: [...others.slice(0, insertAt), ...edge, ...others.slice(insertAt)],
  });
};
