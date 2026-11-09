import { EPSILON, splitSentence } from './notation';
import type { AutomatonDefinition, StateName, ValidationIssue } from './types';

/** Caracteres não permitidos em nomes de estado (reservados pela notação). */
const FORBIDDEN_STATE_CHARS = /[\s,{}()]/;

/** Verifica se um nome de estado é sintaticamente válido. */
export function isValidStateName(name: string): boolean {
  return name.length > 0 && !FORBIDDEN_STATE_CHARS.test(name);
}

/**
 * Verifica se um símbolo é válido: exatamente um caractere visível, diferente
 * de ε (reservado para a sentença vazia).
 */
export function isValidSymbol(symbol: string): boolean {
  return splitSentence(symbol).length === 1 && symbol.trim().length > 0 && symbol !== EPSILON;
}

const quote = (values: readonly string[]) => values.map((v) => `'${v}'`).join(', ');

/** Agrupa índices por chave, retornando apenas grupos com mais de um elemento. */
function findRepeated<T>(items: readonly T[], key: (item: T) => string): Map<string, number[]> {
  const groups = new Map<string, number[]>();
  items.forEach((item, index) => {
    const k = key(item);
    groups.set(k, [...(groups.get(k) ?? []), index]);
  });
  return new Map([...groups].filter(([, indexes]) => indexes.length > 1));
}

/** Calcula os estados alcançáveis a partir de q₀ (busca em largura). */
export function reachableStates(definition: AutomatonDefinition): Set<StateName> {
  const reached = new Set<StateName>();
  if (definition.initialState === null) return reached;
  const queue: StateName[] = [definition.initialState];
  reached.add(definition.initialState);
  while (queue.length > 0) {
    const current = queue.shift() as StateName;
    for (const t of definition.transitions) {
      if (t.from === current && !reached.has(t.to)) {
        reached.add(t.to);
        queue.push(t.to);
      }
    }
  }
  return reached;
}

/**
 * Valida a especificação formal de um autômato.
 *
 * Erros (`error`) impedem a simulação, pois a definição não corresponde a uma
 * quíntupla válida. Avisos (`warning`) indicam situações permitidas pela teoria,
 * mas que costumam ser enganos (ex.: estados inalcançáveis).
 */
export function validateAutomaton(definition: AutomatonDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { states, alphabet, initialState, finalStates, transitions, type } = definition;
  const stateSet = new Set(states);
  const alphabetSet = new Set(alphabet);

  // ── Q: conjunto de estados ─────────────────────────────────────────────
  if (states.length === 0) {
    issues.push({
      code: 'EMPTY_STATES',
      severity: 'error',
      message: 'O conjunto de estados Q está vazio. Adicione pelo menos um estado.',
    });
  }

  const invalidNames = states.filter((s) => !isValidStateName(s));
  if (invalidNames.length > 0) {
    issues.push({
      code: 'INVALID_STATE_NAME',
      severity: 'error',
      message: `Nome(s) de estado inválido(s): ${quote(invalidNames)}. Use nomes não vazios, sem espaços, vírgulas, chaves ou parênteses.`,
      states: invalidNames,
    });
  }

  for (const [name] of findRepeated(states, (s) => s)) {
    issues.push({
      code: 'DUPLICATE_STATE',
      severity: 'error',
      message: `O estado '${name}' foi declarado mais de uma vez. Nomes de estado devem ser únicos.`,
      states: [name],
    });
  }

  // ── Σ: alfabeto ────────────────────────────────────────────────────────
  if (alphabet.length === 0) {
    issues.push({
      code: 'EMPTY_ALPHABET',
      severity: 'error',
      message: 'O alfabeto Σ está vazio. Adicione pelo menos um símbolo.',
    });
  }

  const invalidSymbols = alphabet.filter((s) => !isValidSymbol(s));
  if (invalidSymbols.length > 0) {
    issues.push({
      code: 'INVALID_SYMBOL',
      severity: 'error',
      message: `Símbolo(s) inválido(s) no alfabeto: ${quote(invalidSymbols)}. Cada símbolo deve ter exatamente um caractere visível (ε é reservado).`,
    });
  }

  for (const [symbol] of findRepeated(alphabet, (s) => s)) {
    issues.push({
      code: 'DUPLICATE_SYMBOL',
      severity: 'error',
      message: `O símbolo '${symbol}' foi declarado mais de uma vez no alfabeto.`,
    });
  }

  // ── q₀: estado inicial ─────────────────────────────────────────────────
  if (initialState === null || initialState === '') {
    issues.push({
      code: 'MISSING_INITIAL_STATE',
      severity: 'error',
      message: 'Nenhum estado inicial (q₀) foi definido.',
    });
  } else if (!stateSet.has(initialState)) {
    issues.push({
      code: 'UNKNOWN_INITIAL_STATE',
      severity: 'error',
      message: `O estado inicial '${initialState}' não pertence ao conjunto de estados Q.`,
      states: [initialState],
    });
  }

  // ── F: estados finais ──────────────────────────────────────────────────
  const unknownFinals = finalStates.filter((s) => !stateSet.has(s));
  if (unknownFinals.length > 0) {
    issues.push({
      code: 'UNKNOWN_FINAL_STATE',
      severity: 'error',
      message: `Estado(s) final(is) inexistente(s) em Q: ${quote(unknownFinals)}.`,
      states: unknownFinals,
    });
  }

  for (const [name] of findRepeated(finalStates, (s) => s)) {
    issues.push({
      code: 'DUPLICATE_FINAL_STATE',
      severity: 'warning',
      message: `O estado final '${name}' aparece mais de uma vez em F.`,
      states: [name],
    });
  }

  if (finalStates.length === 0 && states.length > 0) {
    issues.push({
      code: 'NO_FINAL_STATES',
      severity: 'warning',
      message: 'Nenhum estado final foi definido (F = ∅): o autômato não aceita nenhuma sentença.',
    });
  }

  // ── δ: transições ──────────────────────────────────────────────────────
  transitions.forEach((t, index) => {
    if (!stateSet.has(t.from)) {
      issues.push({
        code: 'UNKNOWN_TRANSITION_SOURCE',
        severity: 'error',
        message: `A transição δ(${t.from}, ${t.symbol}) → ${t.to} parte de um estado inexistente ('${t.from}').`,
        transitionIndexes: [index],
      });
    }
    if (!stateSet.has(t.to)) {
      issues.push({
        code: 'UNKNOWN_TRANSITION_TARGET',
        severity: 'error',
        message: `A transição δ(${t.from}, ${t.symbol}) → ${t.to} aponta para um estado inexistente ('${t.to}').`,
        transitionIndexes: [index],
      });
    }
    if (!alphabetSet.has(t.symbol)) {
      issues.push({
        code: 'SYMBOL_NOT_IN_ALPHABET',
        severity: 'error',
        message: `A transição δ(${t.from}, ${t.symbol}) → ${t.to} usa o símbolo '${t.symbol}', que não pertence ao alfabeto Σ.`,
        transitionIndexes: [index],
      });
    }
  });

  for (const [, indexes] of findRepeated(transitions, (t) => `${t.from}\u0000${t.symbol}\u0000${t.to}`)) {
    const t = transitions[indexes[0] as number];
    if (!t) continue;
    issues.push({
      code: 'DUPLICATE_TRANSITION',
      severity: 'error',
      message: `A transição δ(${t.from}, ${t.symbol}) → ${t.to} foi declarada ${indexes.length} vezes.`,
      transitionIndexes: indexes,
    });
  }

  if (type === 'AFD') {
    // δ: Q × Σ → Q exige no máximo um destino por par (estado, símbolo).
    for (const [, indexes] of findRepeated(transitions, (t) => `${t.from}\u0000${t.symbol}`)) {
      const group = indexes.map((i) => transitions[i]).filter((t) => t !== undefined);
      const targets = [...new Set(group.map((t) => t.to))];
      const first = group[0];
      if (targets.length > 1 && first) {
        issues.push({
          code: 'NONDETERMINISTIC_TRANSITION',
          severity: 'error',
          message: `AFD com mais de um destino para δ(${first.from}, ${first.symbol}): {${targets.join(', ')}}. Em um AFD cada par (estado, símbolo) leva a no máximo um estado — converta para AFND ou remova transições.`,
          states: [first.from],
          transitionIndexes: indexes,
        });
      }
    }

    // Função parcial: permitida (a sentença é rejeitada), mas sinalizada.
    const defined = new Set(transitions.map((t) => `${t.from}\u0000${t.symbol}`));
    const missing: string[] = [];
    for (const state of stateSet) {
      for (const symbol of alphabetSet) {
        if (!defined.has(`${state}\u0000${symbol}`)) missing.push(`δ(${state}, ${symbol})`);
      }
    }
    if (missing.length > 0) {
      const shown = missing.slice(0, 6).join(', ');
      const more = missing.length > 6 ? ` e mais ${missing.length - 6}` : '';
      issues.push({
        code: 'INCOMPLETE_DFA',
        severity: 'warning',
        message: `A função de transição é parcial: ${shown}${more} não estão definidas. Sentenças que dependam delas serão rejeitadas.`,
      });
    }
  }

  // ── Alcançabilidade ────────────────────────────────────────────────────
  if (initialState !== null && stateSet.has(initialState)) {
    const reached = reachableStates(definition);
    const unreachable = [...stateSet].filter((s) => !reached.has(s));
    if (unreachable.length > 0) {
      issues.push({
        code: 'UNREACHABLE_STATE',
        severity: 'warning',
        message: `Estado(s) inalcançável(is) a partir de ${initialState}: ${quote(unreachable)}.`,
        states: unreachable,
      });
    }
  }

  return issues;
}

/** Indica se há algum erro bloqueante entre os problemas encontrados. */
export function hasErrors(issues: readonly ValidationIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'error');
}

/** Problema encontrado em uma sentença de entrada. */
export interface SentenceIssue {
  position: number;
  symbol: string;
  message: string;
}

/**
 * Verifica se todos os símbolos da sentença pertencem ao alfabeto.
 * A sentença vazia (ε) é sempre válida.
 */
export function validateSentence(definition: Pick<AutomatonDefinition, 'alphabet'>, input: string): SentenceIssue[] {
  const alphabet = new Set(definition.alphabet);
  return splitSentence(input).flatMap((symbol, position) =>
    alphabet.has(symbol)
      ? []
      : [
          {
            position,
            symbol,
            message:
              symbol.trim() === ''
                ? `Espaço em branco na posição ${position + 1} não pertence ao alfabeto.`
                : `O símbolo '${symbol}' (posição ${position + 1}) não pertence ao alfabeto.`,
          },
        ],
  );
}
