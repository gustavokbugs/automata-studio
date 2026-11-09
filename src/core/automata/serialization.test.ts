import { describe, expect, it } from 'vitest';
import { parseAutomatonJson, parseAutomatonObject, serializeAutomaton, toAutomatonFile } from './serialization';
import type { AutomatonProject } from './types';

const project: AutomatonProject = {
  id: 'p1',
  name: 'Par de zeros',
  description: 'Quantidade par de zeros',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  definition: {
    type: 'AFD',
    states: ['q0', 'q1'],
    alphabet: ['0', '1'],
    initialState: 'q0',
    finalStates: ['q0'],
    transitions: [
      { from: 'q0', symbol: '0', to: 'q1' },
      { from: 'q0', symbol: '1', to: 'q0' },
      { from: 'q1', symbol: '0', to: 'q0' },
      { from: 'q1', symbol: '1', to: 'q1' },
    ],
  },
  layout: { q0: { x: 0.4, y: 10 }, q1: { x: 180, y: 10 } },
};

describe('exportação', () => {
  it('gera o arquivo com formato, versão e quíntupla', () => {
    const file = toAutomatonFile(project);
    expect(file).toMatchObject({
      format: 'automata-studio',
      version: 1,
      name: 'Par de zeros',
      type: 'AFD',
      states: ['q0', 'q1'],
      initialState: 'q0',
    });
    expect(file.layout?.q0).toEqual({ x: 0, y: 10 });
  });

  it('não inclui metadados internos (id, datas)', () => {
    const text = serializeAutomaton(project);
    expect(text).not.toContain('createdAt');
    expect(text).not.toContain('"id"');
    expect(text.endsWith('\n')).toBe(true);
  });
});

describe('importação', () => {
  it('ida e volta preserva a definição formal', () => {
    const parsed = parseAutomatonJson(serializeAutomaton(project));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.definition).toEqual(project.definition);
    expect(parsed.value.name).toBe(project.name);
    expect(parsed.value.description).toBe(project.description);
  });

  it('aceita transições no formato de tabela (inclusive AFND)', () => {
    const parsed = parseAutomatonObject({
      type: 'AFND',
      states: ['a', 'b'],
      alphabet: ['x'],
      initialState: 'a',
      finalStates: ['b'],
      transitions: { a: { x: ['a', 'b'] }, b: { x: 'b' } },
    });
    expect(parsed.ok && parsed.value.definition.transitions).toEqual([
      { from: 'a', symbol: 'x', to: 'a' },
      { from: 'a', symbol: 'x', to: 'b' },
      { from: 'b', symbol: 'x', to: 'b' },
    ]);
  });

  it('converte símbolos numéricos para texto', () => {
    const parsed = parseAutomatonObject({
      type: 'AFD',
      states: ['q0'],
      alphabet: [0, 1],
      initialState: 'q0',
      finalStates: [],
      transitions: [{ from: 'q0', symbol: 0, to: 'q0' }],
    });
    expect(parsed.ok && parsed.value.definition.alphabet).toEqual(['0', '1']);
    expect(parsed.ok && parsed.value.definition.transitions[0]?.symbol).toBe('0');
  });

  it('gera layout automático quando ausente', () => {
    const parsed = parseAutomatonObject({
      type: 'AFD',
      states: ['q0', 'q1'],
      alphabet: ['a'],
      initialState: 'q0',
      finalStates: [],
      transitions: [],
    });
    expect(parsed.ok && Object.keys(parsed.value.layout)).toEqual(['q0', 'q1']);
    expect(parsed.ok && parsed.value.name).toBe('Autômato importado');
  });

  it('mantém erros semânticos para correção no editor', () => {
    const parsed = parseAutomatonObject({
      type: 'AFD',
      states: ['q0', 'q0'],
      alphabet: ['a'],
      initialState: 'q9',
      finalStates: [],
      transitions: [],
    });
    expect(parsed.ok).toBe(true);
  });

  it('ignora layout malformado com aviso', () => {
    const parsed = parseAutomatonObject({
      type: 'AFD',
      states: ['q0'],
      alphabet: ['a'],
      initialState: 'q0',
      finalStates: [],
      transitions: [],
      layout: 'invalido',
    });
    expect(parsed.ok && parsed.warnings).toHaveLength(1);
  });
});

describe('importação — arquivos inválidos', () => {
  const errorsOf = (text: string) => {
    const parsed = parseAutomatonJson(text);
    return parsed.ok ? [] : parsed.errors;
  };

  it('rejeita arquivo vazio', () => {
    expect(errorsOf('   ')).toEqual(['O arquivo está vazio.']);
  });

  it('rejeita JSON sintaticamente inválido', () => {
    expect(errorsOf('{ "type": "AFD", ')[0]).toMatch(/^JSON inválido/);
  });

  it('rejeita conteúdo que não é objeto', () => {
    expect(errorsOf('[1, 2, 3]')[0]).toMatch(/objeto JSON/);
  });

  it('lista todos os campos obrigatórios ausentes (especificação incompleta)', () => {
    const errors = errorsOf('{}');
    expect(errors).toEqual([
      'Campo obrigatório ausente: "type" ("AFD" ou "AFND").',
      'Campo obrigatório ausente: "states".',
      'Campo obrigatório ausente: "alphabet".',
      'Campo obrigatório ausente: "finalStates".',
      'Campo obrigatório ausente: "initialState".',
      'Campo obrigatório ausente: "transitions".',
    ]);
  });

  it('rejeita tipos de campo incorretos', () => {
    const errors = errorsOf(
      JSON.stringify({
        type: 'AFX',
        states: 'q0,q1',
        alphabet: ['a', null],
        initialState: 3,
        finalStates: [],
        transitions: [{ from: 'q0', to: 'q1' }, 5],
      }),
    );
    expect(errors).toHaveLength(6);
    expect(errors.join('\n')).toMatch(/"type" deve ser "AFD" ou "AFND"/);
    expect(errors.join('\n')).toMatch(/"states" deve ser uma lista/);
    expect(errors.join('\n')).toMatch(/"alphabet\[1\]"/);
    expect(errors.join('\n')).toMatch(/"initialState"/);
    expect(errors.join('\n')).toMatch(/"transitions\[0\]" está incompleta: "symbol"/);
    expect(errors.join('\n')).toMatch(/"transitions\[1\]"/);
  });

  it('rejeita formato e versão desconhecidos', () => {
    const errors = errorsOf(
      JSON.stringify({ ...JSON.parse(serializeAutomaton(project)), format: 'outro', version: 9 }),
    );
    expect(errors).toHaveLength(2);
  });
});
