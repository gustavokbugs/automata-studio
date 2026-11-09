import type { AlphabetSymbol, AutomatonType, StateName, Transition } from '../automata/types';

/**
 * Situação da computação após uma etapa.
 *  - `running`  → ainda há símbolos a ler;
 *  - `accepted` → a sentença terminou e foi aceita;
 *  - `rejected` → a computação parou e a sentença foi rejeitada.
 */
export type StepStatus = 'running' | 'accepted' | 'rejected';

/** Motivo pelo qual a execução terminou. */
export type HaltReason =
  /** Toda a sentença foi lida e há estado ativo final. */
  | 'accepted'
  /** Toda a sentença foi lida, mas nenhum estado ativo é final. */
  | 'not-final'
  /** AFD: δ(q, a) é indefinida para o estado atual. */
  | 'no-transition'
  /** AFND: o conjunto de estados ativos ficou vazio. */
  | 'empty-active-set'
  /** A sentença contém um símbolo que não pertence a Σ. */
  | 'invalid-symbol'
  /** A definição do autômato possui erros e não pode ser simulada. */
  | 'invalid-automaton';

/**
 * Uma etapa da computação (uma "configuração instantânea").
 *
 * A etapa 0 é a configuração inicial (nenhum símbolo lido). Cada etapa
 * seguinte corresponde à leitura de exatamente um símbolo da sentença.
 */
export interface ExecutionStep {
  /** Índice da etapa (0 = configuração inicial). */
  index: number;
  /** Quantidade de símbolos já consumidos após esta etapa. */
  consumed: number;
  /** Posição (base 0) do símbolo lido nesta etapa; `null` na etapa 0. */
  position: number | null;
  /** Símbolo lido nesta etapa; `null` na etapa 0. */
  symbol: AlphabetSymbol | null;
  /** Estados ativos antes da leitura do símbolo. */
  previousStates: StateName[];
  /** Estados ativos depois da leitura do símbolo. */
  activeStates: StateName[];
  /** Transições efetivamente percorridas nesta etapa. */
  transitions: Transition[];
  /**
   * Estados anteriores que não possuíam transição para o símbolo lido.
   * Representam caminhos de computação descartados.
   */
  discardedStates: StateName[];
  /** Situação da computação após esta etapa. */
  status: StepStatus;
  /** Descrição textual, legível, do que ocorreu nesta etapa. */
  description: string;
}

/** Resultado completo de uma simulação: o "trace" de todas as etapas. */
export interface ExecutionResult {
  type: AutomatonType;
  /** Sentença original. */
  input: string;
  /** Sentença decomposta em símbolos (um caractere por símbolo). */
  symbols: AlphabetSymbol[];
  /** Etapas da computação, começando pela configuração inicial. */
  steps: ExecutionStep[];
  accepted: boolean;
  reason: HaltReason;
  /** Quantidade de símbolos efetivamente processados. */
  processedSymbols: number;
  /** Estados ativos ao final da execução. */
  finalActiveStates: StateName[];
  /**
   * AFD: sequência de estados visitados (q₀, q₁, …).
   * AFND: `null` (use `activeSets`).
   */
  path: StateName[] | null;
  /** Conjunto de estados ativos após cada etapa (inclui a etapa 0). */
  activeSets: StateName[][];
  /** Mensagem final legível. */
  summary: string;
}
