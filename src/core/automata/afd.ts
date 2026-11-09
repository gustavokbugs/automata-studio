import { formatSentence, splitSentence } from './notation';
import type { AutomatonDefinition, StateName, Transition } from './types';
import type { ExecutionResult, ExecutionStep, HaltReason } from '../simulation/types';

/**
 * Função de transição do AFD: δ(q, a).
 *
 * Retorna a transição definida para o par (estado, símbolo) ou `null` quando
 * δ é indefinida (função parcial). A validação garante que um AFD válido não
 * possui mais de um destino por par, portanto basta encontrar a primeira.
 */
export function dfaTransition(
  definition: AutomatonDefinition,
  state: StateName,
  symbol: string,
): Transition | null {
  return definition.transitions.find((t) => t.from === state && t.symbol === symbol) ?? null;
}

/**
 * Simula um Autômato Finito Determinístico sobre a sentença `input`.
 *
 * Algoritmo:
 *  1. q ← q₀
 *  2. Para cada símbolo a da sentença, da esquerda para a direita:
 *     a. se a ∉ Σ, rejeita;
 *     b. se δ(q, a) é indefinida, rejeita;
 *     c. q ← δ(q, a).
 *  3. Ao final, aceita se, e somente se, q ∈ F.
 *
 * A função assume uma definição válida (ver `validateAutomaton`) e registra
 * cada configuração instantânea em `steps`.
 */
export function runDfa(definition: AutomatonDefinition, input: string): ExecutionResult {
  const symbols = splitSentence(input);
  const alphabet = new Set(definition.alphabet);
  const finals = new Set(definition.finalStates);
  const initial = definition.initialState;

  if (initial === null) {
    throw new Error('O AFD não possui estado inicial definido.');
  }

  let current: StateName = initial;
  const path: StateName[] = [current];
  const steps: ExecutionStep[] = [];

  const finish = (reason: HaltReason, finalStates: StateName[], summary: string): ExecutionResult => ({
    type: 'AFD',
    input,
    symbols,
    steps,
    accepted: reason === 'accepted',
    reason,
    processedSymbols: steps.at(-1)?.consumed ?? 0,
    finalActiveStates: finalStates,
    path,
    activeSets: steps.map((s) => s.activeStates),
    summary,
  });

  // Etapa 0: configuração inicial.
  const emptyInput = symbols.length === 0;
  const initialAccepts = finals.has(initial);
  steps.push({
    index: 0,
    consumed: 0,
    position: null,
    symbol: null,
    previousStates: [],
    activeStates: [initial],
    transitions: [],
    discardedStates: [],
    status: emptyInput ? (initialAccepts ? 'accepted' : 'rejected') : 'running',
    description: emptyInput
      ? `Sentença vazia (ε): ${initial} ${initialAccepts ? '∈' : '∉'} F.`
      : `Configuração inicial: estado atual ${initial}.`,
  });

  for (const [position, symbol] of symbols.entries()) {
    const index = position + 1;

    if (!alphabet.has(symbol)) {
      steps.push({
        index,
        consumed: position,
        position,
        symbol,
        previousStates: [current],
        activeStates: [],
        transitions: [],
        discardedStates: [current],
        status: 'rejected',
        description: `O símbolo '${symbol}' (posição ${position + 1}) não pertence ao alfabeto Σ.`,
      });
      return finish('invalid-symbol', [], `Rejeitada: '${symbol}' não pertence ao alfabeto.`);
    }

    const transition = dfaTransition(definition, current, symbol);

    if (transition === null) {
      steps.push({
        index,
        consumed: position,
        position,
        symbol,
        previousStates: [current],
        activeStates: [],
        transitions: [],
        discardedStates: [current],
        status: 'rejected',
        description: `δ(${current}, ${symbol}) é indefinida: não há transição válida.`,
      });
      return finish(
        'no-transition',
        [],
        `Rejeitada: não existe transição a partir de ${current} com o símbolo '${symbol}'.`,
      );
    }

    const previous = current;
    current = transition.to;
    path.push(current);

    const isLast = index === symbols.length;
    const accepted = finals.has(current);
    steps.push({
      index,
      consumed: index,
      position,
      symbol,
      previousStates: [previous],
      activeStates: [current],
      transitions: [transition],
      discardedStates: [],
      status: isLast ? (accepted ? 'accepted' : 'rejected') : 'running',
      description:
        `δ(${previous}, ${symbol}) = ${current}` +
        (isLast ? ` — fim da sentença: ${current} ${accepted ? '∈' : '∉'} F.` : '.'),
    });
  }

  const accepted = finals.has(current);
  const sentence = formatSentence(input);
  return finish(
    accepted ? 'accepted' : 'not-final',
    [current],
    accepted
      ? `Aceita: a leitura de "${sentence}" termina no estado final ${current}.`
      : `Rejeitada: a leitura de "${sentence}" termina em ${current}, que não é final.`,
  );
}
