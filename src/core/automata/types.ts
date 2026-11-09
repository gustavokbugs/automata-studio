/**
 * Tipos centrais do modelo matemático.
 *
 * Um autômato finito é a quíntupla M = (Q, Σ, δ, q₀, F):
 *  - Q  → `states`        (conjunto finito de estados)
 *  - Σ  → `alphabet`      (conjunto finito de símbolos)
 *  - δ  → `transitions`   (função de transição, representada como relação)
 *  - q₀ → `initialState`
 *  - F  → `finalStates`
 *
 * A função δ é armazenada como uma lista de triplas (origem, símbolo, destino).
 * Essa representação relacional atende aos dois modelos:
 *  - AFD:  δ: Q × Σ → Q     (no máximo uma tripla por par (q, a))
 *  - AFND: δ: Q × Σ → P(Q)  (δ(q, a) = { p | (q, a, p) ∈ transitions })
 *
 * Os tipos deste módulo não dependem de React nem de qualquer detalhe visual.
 */

/** Tipo do autômato: determinístico ou não determinístico. */
export type AutomatonType = 'AFD' | 'AFND';

/** Nome de um estado (elemento de Q). Os nomes são únicos dentro de um autômato. */
export type StateName = string;

/** Símbolo do alfabeto (elemento de Σ). Cada símbolo tem exatamente um caractere. */
export type AlphabetSymbol = string;

/** Uma tripla da relação de transição: (from, symbol) ↦ to. */
export interface Transition {
  from: StateName;
  symbol: AlphabetSymbol;
  to: StateName;
}

/**
 * Definição formal de um autômato finito. É a única informação usada pelos
 * algoritmos de simulação e validação.
 */
export interface AutomatonDefinition {
  type: AutomatonType;
  states: StateName[];
  alphabet: AlphabetSymbol[];
  initialState: StateName | null;
  finalStates: StateName[];
  transitions: Transition[];
}

/** Posição de um estado no editor visual. */
export interface Point {
  x: number;
  y: number;
}

/**
 * Disposição visual dos estados. Fica separada da definição formal para que
 * mover nós no editor nunca altere a semântica do autômato.
 */
export type AutomatonLayout = Record<StateName, Point>;

/** Projeto salvo pelo usuário: metadados + definição formal + layout. */
export interface AutomatonProject {
  id: string;
  name: string;
  description: string;
  definition: AutomatonDefinition;
  layout: AutomatonLayout;
  createdAt: string;
  updatedAt: string;
}

/** Severidade de um problema encontrado na validação. */
export type IssueSeverity = 'error' | 'warning';

/** Códigos estáveis para cada tipo de problema de validação. */
export type ValidationCode =
  | 'EMPTY_STATES'
  | 'EMPTY_ALPHABET'
  | 'INVALID_STATE_NAME'
  | 'DUPLICATE_STATE'
  | 'INVALID_SYMBOL'
  | 'DUPLICATE_SYMBOL'
  | 'MISSING_INITIAL_STATE'
  | 'UNKNOWN_INITIAL_STATE'
  | 'UNKNOWN_FINAL_STATE'
  | 'DUPLICATE_FINAL_STATE'
  | 'NO_FINAL_STATES'
  | 'UNKNOWN_TRANSITION_SOURCE'
  | 'UNKNOWN_TRANSITION_TARGET'
  | 'SYMBOL_NOT_IN_ALPHABET'
  | 'DUPLICATE_TRANSITION'
  | 'NONDETERMINISTIC_TRANSITION'
  | 'INCOMPLETE_DFA'
  | 'UNREACHABLE_STATE';

/** Um problema encontrado ao validar uma definição. */
export interface ValidationIssue {
  code: ValidationCode;
  severity: IssueSeverity;
  message: string;
  /** Estados envolvidos (para destaque no editor). */
  states?: StateName[];
  /** Índices em `definition.transitions` envolvidos (para destaque no editor). */
  transitionIndexes?: number[];
}
