import { formatSentence, formatStateSet, sortStates, splitSentence } from './notation';
import type { AutomatonDefinition, StateName, Transition } from './types';
import type { ExecutionResult, ExecutionStep, HaltReason } from '../simulation/types';

/**
 * Função de transição do AFND: δ(q, a) ⊆ Q.
 *
 * Retorna todas as transições (q, a, p). Triplas repetidas são ignoradas.
 */
export function nfaTransitions(definition: AutomatonDefinition, state: StateName, symbol: string): Transition[] {
  const seen = new Set<StateName>();
  const result: Transition[] = [];
  for (const t of definition.transitions) {
    if (t.from === state && t.symbol === symbol && !seen.has(t.to)) {
      seen.add(t.to);
      result.push(t);
    }
  }
  return result;
}

/**
 * Fecho de um conjunto de estados.
 *
 * Nesta versão não há transições vazias, portanto o fecho de S é o próprio S.
 * Este é o ponto de extensão para AFND-ε: bastará substituir a implementação
 * pelo ε-fecho (busca em largura pelas transições com símbolo ε) sem alterar
 * o restante do algoritmo.
 */
export function closure(_definition: AutomatonDefinition, states: ReadonlySet<StateName>): Set<StateName> {
  return new Set(states);
}

/** Resultado de aplicar a função "move" a um conjunto de estados. */
export interface NfaMove {
  /** Estados alcançados: ⋃ δ(q, a) para q ∈ S. */
  next: Set<StateName>;
  /** Transições efetivamente utilizadas. */
  transitions: Transition[];
  /** Estados de S sem transição para `a` (caminhos que morrem). */
  discarded: StateName[];
}

/**
 * move(S, a) = ⋃_{q ∈ S} δ(q, a).
 *
 * Calcula todos os estados alcançáveis a partir dos estados ativos, mantendo
 * todos os caminhos possíveis simultaneamente.
 */
export function nfaMove(definition: AutomatonDefinition, active: Iterable<StateName>, symbol: string): NfaMove {
  const next = new Set<StateName>();
  const transitions: Transition[] = [];
  const discarded: StateName[] = [];

  for (const state of active) {
    const outgoing = nfaTransitions(definition, state, symbol);
    if (outgoing.length === 0) discarded.push(state);
    for (const t of outgoing) {
      transitions.push(t);
      next.add(t.to);
    }
  }

  return { next, transitions, discarded };
}

/**
 * Simula um Autômato Finito Não Determinístico sobre a sentença `input`.
 *
 * Algoritmo (simulação por conjuntos de estados):
 *  1. S ← fecho({q₀})
 *  2. Para cada símbolo a da sentença:
 *     a. se a ∉ Σ, rejeita;
 *     b. S ← fecho(move(S, a));
 *     c. se S = ∅, rejeita (nenhum caminho sobreviveu).
 *  3. Ao final, aceita se, e somente se, S ∩ F ≠ ∅.
 *
 * Diferentemente do AFD, vários estados permanecem ativos ao mesmo tempo:
 * cada um representa um ramo da computação não determinística.
 */
export function runNfa(definition: AutomatonDefinition, input: string): ExecutionResult {
  const symbols = splitSentence(input);
  const alphabet = new Set(definition.alphabet);
  const finals = new Set(definition.finalStates);

  if (definition.initialState === null) {
    throw new Error('O AFND não possui estado inicial definido.');
  }

  const sorted = (states: Iterable<StateName>) => sortStates(definition, states);
  const hasFinal = (states: readonly StateName[]) => states.some((s) => finals.has(s));

  let active = sorted(closure(definition, new Set([definition.initialState])));
  const steps: ExecutionStep[] = [];

  const finish = (reason: HaltReason, summary: string): ExecutionResult => ({
    type: 'AFND',
    input,
    symbols,
    steps,
    accepted: reason === 'accepted',
    reason,
    processedSymbols: steps.at(-1)?.consumed ?? 0,
    finalActiveStates: steps.at(-1)?.activeStates ?? [],
    path: null,
    activeSets: steps.map((s) => s.activeStates),
    summary,
  });

  // Etapa 0: configuração inicial.
  const emptyInput = symbols.length === 0;
  const initialAccepts = hasFinal(active);
  steps.push({
    index: 0,
    consumed: 0,
    position: null,
    symbol: null,
    previousStates: [],
    activeStates: active,
    transitions: [],
    discardedStates: [],
    status: emptyInput ? (initialAccepts ? 'accepted' : 'rejected') : 'running',
    description: emptyInput
      ? `Sentença vazia (ε): ${formatStateSet(active)} ∩ F ${initialAccepts ? '≠' : '='} ∅.`
      : `Configuração inicial: estados ativos ${formatStateSet(active)}.`,
  });

  for (const [position, symbol] of symbols.entries()) {
    const index = position + 1;

    if (!alphabet.has(symbol)) {
      steps.push({
        index,
        consumed: position,
        position,
        symbol,
        previousStates: active,
        activeStates: [],
        transitions: [],
        discardedStates: active,
        status: 'rejected',
        description: `O símbolo '${symbol}' (posição ${position + 1}) não pertence ao alfabeto Σ.`,
      });
      return finish('invalid-symbol', `Rejeitada: '${symbol}' não pertence ao alfabeto.`);
    }

    const move = nfaMove(definition, active, symbol);
    const next = sorted(closure(definition, move.next));
    const previous = active;
    active = next;

    if (next.length === 0) {
      // Assim como no AFD, o símbolo que leva à parada não conta como processado.
      steps.push({
        index,
        consumed: position,
        position,
        symbol,
        previousStates: previous,
        activeStates: [],
        transitions: [],
        discardedStates: move.discarded,
        status: 'rejected',
        description: `move(${formatStateSet(previous)}, ${symbol}) = ∅: nenhum caminho sobreviveu.`,
      });
      return finish(
        'empty-active-set',
        `Rejeitada: após ler '${symbol}' (posição ${index}) nenhum estado permaneceu ativo.`,
      );
    }

    const isLast = index === symbols.length;
    const accepted = hasFinal(next);
    steps.push({
      index,
      consumed: index,
      position,
      symbol,
      previousStates: previous,
      activeStates: next,
      transitions: move.transitions,
      discardedStates: move.discarded,
      status: isLast ? (accepted ? 'accepted' : 'rejected') : 'running',
      description:
        `move(${formatStateSet(previous)}, ${symbol}) = ${formatStateSet(next)}` +
        (isLast ? ` — fim da sentença: ${formatStateSet(next)} ∩ F ${accepted ? '≠' : '='} ∅.` : '.'),
    });
  }

  const sentence = formatSentence(input);
  const acceptingStates = active.filter((s) => finals.has(s));
  return acceptingStates.length > 0
    ? finish(
        'accepted',
        `Aceita: ao terminar "${sentence}", os estados ativos ${formatStateSet(active)} incluem o(s) final(is) ${formatStateSet(acceptingStates)}.`,
      )
    : finish(
        'not-final',
        `Rejeitada: ao terminar "${sentence}", nenhum dos estados ativos ${formatStateSet(active)} é final.`,
      );
}
