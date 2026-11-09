import { completeLayout } from './layout';
import type {
  AutomatonDefinition,
  AutomatonLayout,
  AutomatonProject,
  AutomatonType,
  Point,
  Transition,
} from './types';

/**
 * Formato de arquivo JSON do Automata Studio.
 *
 * {
 *   "format": "automata-studio",
 *   "version": 1,
 *   "name": "Quantidade par de zeros",
 *   "type": "AFD",
 *   "states": ["q0", "q1"],
 *   "alphabet": ["0", "1"],
 *   "initialState": "q0",
 *   "finalStates": ["q0"],
 *   "transitions": [{ "from": "q0", "symbol": "0", "to": "q1" }, …],
 *   "layout": { "q0": { "x": 0, "y": 0 } }          // opcional
 * }
 *
 * Por conveniência, `transitions` também pode ser escrito como tabela:
 *   { "q0": { "0": "q1", "1": ["q0", "q1"] } }
 */
export const FILE_FORMAT = 'automata-studio';
export const FILE_VERSION = 1;

/** Estrutura do arquivo JSON exportado. */
export interface AutomatonFile {
  format: typeof FILE_FORMAT;
  version: typeof FILE_VERSION;
  name: string;
  description?: string;
  type: AutomatonType;
  states: string[];
  alphabet: string[];
  initialState: string | null;
  finalStates: string[];
  transitions: Transition[];
  layout?: AutomatonLayout;
}

/** Especificação lida de um arquivo, pronta para virar um projeto. */
export interface ParsedAutomaton {
  name: string;
  description: string;
  definition: AutomatonDefinition;
  layout: AutomatonLayout;
}

export type ParseResult =
  | { ok: true; value: ParsedAutomaton; warnings: string[] }
  | { ok: false; errors: string[] };

/** Converte um projeto para o objeto do arquivo JSON. */
export function toAutomatonFile(project: Pick<AutomatonProject, 'name' | 'description' | 'definition' | 'layout'>): AutomatonFile {
  const { definition } = project;
  const file: AutomatonFile = {
    format: FILE_FORMAT,
    version: FILE_VERSION,
    name: project.name,
    type: definition.type,
    states: [...definition.states],
    alphabet: [...definition.alphabet],
    initialState: definition.initialState,
    finalStates: [...definition.finalStates],
    transitions: definition.transitions.map(({ from, symbol, to }) => ({ from, symbol, to })),
    layout: Object.fromEntries(
      definition.states
        .filter((s) => project.layout[s])
        .map((s) => {
          const p = project.layout[s] as Point;
          return [s, { x: Math.round(p.x), y: Math.round(p.y) }];
        }),
    ),
  };
  if (project.description) file.description = project.description;
  return file;
}

/** Serializa um projeto como JSON formatado. */
export function serializeAutomaton(
  project: Pick<AutomatonProject, 'name' | 'description' | 'definition' | 'layout'>,
): string {
  return `${JSON.stringify(toAutomatonFile(project), null, 2)}\n`;
}

// ── Leitura ──────────────────────────────────────────────────────────────

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const describe = (value: unknown): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'lista';
  return typeof value === 'string' ? 'texto' : typeof value === 'number' ? 'número' : typeof value;
};

function readStringList(raw: Record<string, unknown>, field: string, errors: string[]): string[] {
  const value = raw[field];
  if (value === undefined) {
    errors.push(`Campo obrigatório ausente: "${field}".`);
    return [];
  }
  if (!Array.isArray(value)) {
    errors.push(`O campo "${field}" deve ser uma lista de textos (recebido: ${describe(value)}).`);
    return [];
  }
  const result: string[] = [];
  value.forEach((item, i) => {
    if (typeof item === 'string') result.push(item);
    else if (typeof item === 'number') result.push(String(item));
    else errors.push(`"${field}[${i}]" deve ser um texto (recebido: ${describe(item)}).`);
  });
  return result;
}

function readTransitions(value: unknown, errors: string[]): Transition[] {
  if (value === undefined) {
    errors.push('Campo obrigatório ausente: "transitions".');
    return [];
  }

  // Formato lista: [{ from, symbol, to }]
  if (Array.isArray(value)) {
    const result: Transition[] = [];
    value.forEach((item, i) => {
      if (!isRecord(item)) {
        errors.push(`"transitions[${i}]" deve ser um objeto { "from", "symbol", "to" }.`);
        return;
      }
      const fields = ['from', 'symbol', 'to'] as const;
      const values = fields.map((f) => (typeof item[f] === 'number' ? String(item[f]) : item[f]));
      const missing = fields.filter((_, k) => typeof values[k] !== 'string');
      if (missing.length > 0) {
        errors.push(`"transitions[${i}]" está incompleta: ${missing.map((f) => `"${f}"`).join(', ')} ausente(s) ou inválido(s).`);
        return;
      }
      const [from, symbol, to] = values as [string, string, string];
      result.push({ from, symbol, to });
    });
    return result;
  }

  // Formato tabela: { estado: { símbolo: destino | [destinos] } }
  if (isRecord(value)) {
    const result: Transition[] = [];
    for (const [from, row] of Object.entries(value)) {
      if (!isRecord(row)) {
        errors.push(`"transitions.${from}" deve ser um objeto { símbolo: destino }.`);
        continue;
      }
      for (const [symbol, target] of Object.entries(row)) {
        const targets = Array.isArray(target) ? target : [target];
        targets.forEach((to) => {
          if (typeof to === 'string') result.push({ from, symbol, to });
          else errors.push(`"transitions.${from}.${symbol}" deve ser um estado ou uma lista de estados.`);
        });
      }
    }
    return result;
  }

  errors.push(`O campo "transitions" deve ser uma lista ou uma tabela (recebido: ${describe(value)}).`);
  return [];
}

function readLayout(value: unknown, warnings: string[]): AutomatonLayout {
  if (value === undefined) return {};
  if (!isRecord(value)) {
    warnings.push('O campo "layout" foi ignorado por não ser um objeto.');
    return {};
  }
  const layout: AutomatonLayout = {};
  for (const [state, point] of Object.entries(value)) {
    if (isRecord(point) && Number.isFinite(point.x) && Number.isFinite(point.y)) {
      layout[state] = { x: point.x as number, y: point.y as number };
    }
  }
  return layout;
}

/**
 * Lê e verifica a estrutura de um objeto de especificação. A validação
 * semântica (estados inexistentes, não determinismo etc.) é feita depois,
 * por `validateAutomaton`, para que o usuário possa corrigir no editor.
 */
export function parseAutomatonObject(raw: unknown): ParseResult {
  if (!isRecord(raw)) {
    return { ok: false, errors: ['O conteúdo deve ser um objeto JSON com a especificação do autômato.'] };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  if (raw.format !== undefined && raw.format !== FILE_FORMAT) {
    errors.push(`Formato de arquivo desconhecido: "${String(raw.format)}".`);
  }
  if (raw.version !== undefined && raw.version !== FILE_VERSION) {
    errors.push(`Versão de arquivo não suportada: ${String(raw.version)} (esperado: ${FILE_VERSION}).`);
  }

  let type: AutomatonType = 'AFD';
  if (raw.type === undefined) errors.push('Campo obrigatório ausente: "type" ("AFD" ou "AFND").');
  else if (raw.type === 'AFD' || raw.type === 'AFND') type = raw.type;
  else errors.push(`O campo "type" deve ser "AFD" ou "AFND" (recebido: ${JSON.stringify(raw.type)}).`);

  const states = readStringList(raw, 'states', errors);
  const alphabet = readStringList(raw, 'alphabet', errors);
  const finalStates = readStringList(raw, 'finalStates', errors);

  let initialState: string | null = null;
  if (!('initialState' in raw)) errors.push('Campo obrigatório ausente: "initialState".');
  else if (typeof raw.initialState === 'string') initialState = raw.initialState;
  else if (raw.initialState !== null) {
    errors.push(`O campo "initialState" deve ser o nome de um estado (recebido: ${describe(raw.initialState)}).`);
  }

  const transitions = readTransitions(raw.transitions, errors);
  const layout = readLayout(raw.layout, warnings);

  if (errors.length > 0) return { ok: false, errors };

  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'Autômato importado';
  const description = typeof raw.description === 'string' ? raw.description : '';

  return {
    ok: true,
    warnings,
    value: {
      name,
      description,
      definition: { type, states, alphabet, initialState, finalStates, transitions },
      layout: completeLayout(states, layout),
    },
  };
}

/** Lê uma especificação a partir do texto de um arquivo JSON. */
export function parseAutomatonJson(text: string): ParseResult {
  if (text.trim() === '') {
    return { ok: false, errors: ['O arquivo está vazio.'] };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { ok: false, errors: [`JSON inválido: ${detail}`] };
  }
  return parseAutomatonObject(raw);
}
