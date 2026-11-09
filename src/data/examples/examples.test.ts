import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EXAMPLES, findExample } from './index';
import { simulate } from '../../core/simulation/simulator';
import { validateAutomaton } from '../../core/automata/validation';
import { parseAutomatonJson } from '../../core/automata/serialization';

/** Todas as sentenças binárias de comprimento 0 até `maxLength`. */
function allBinaryStrings(maxLength: number): string[] {
  const result = [''];
  let layer = [''];
  for (let n = 1; n <= maxLength; n++) {
    layer = layer.flatMap((w) => [`${w}0`, `${w}1`]);
    result.push(...layer);
  }
  return result;
}

/** Definições de referência das linguagens, independentes dos autômatos. */
const languages: Record<string, (w: string) => boolean> = {
  'afd-par-de-zeros': (w) => [...w].filter((c) => c === '0').length % 2 === 0,
  'afd-termina-em-01': (w) => w.endsWith('01'),
  'afnd-contem-01': (w) => w.includes('01'),
  'afnd-penultimo-1': (w) => w.length >= 2 && w[w.length - 2] === '1',
};

describe('exemplos prontos', () => {
  it('incluem os três exemplos exigidos e um extra', () => {
    expect(EXAMPLES.map((e) => [e.id, e.definition.type])).toEqual([
      ['afd-par-de-zeros', 'AFD'],
      ['afd-termina-em-01', 'AFD'],
      ['afnd-contem-01', 'AFND'],
      ['afnd-penultimo-1', 'AFND'],
    ]);
  });

  it('o exemplo 1 segue exatamente a especificação da proposta', () => {
    const example = findExample('afd-par-de-zeros');
    expect(example?.definition).toEqual({
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
    });
  });

  for (const example of EXAMPLES) {
    describe(example.name, () => {
      it('não possui erros nem avisos de validação', () => {
        expect(validateAutomaton(example.definition)).toEqual([]);
      });

      it('classifica corretamente as sentenças de demonstração', () => {
        for (const sample of example.samples) {
          expect(simulate(example.definition, sample.input).result.accepted, `"${sample.input}"`).toBe(sample.accepted);
        }
      });

      it('reconhece exatamente a linguagem esperada (todas as sentenças até 10 símbolos)', () => {
        const reference = languages[example.id];
        expect(reference).toBeDefined();
        for (const w of allBinaryStrings(10)) {
          expect(simulate(example.definition, w).result.accepted, `"${w}"`).toBe(reference?.(w));
        }
      });
    });
  }
});

describe('arquivos em examples/invalidos', () => {
  const dir = join(process.cwd(), 'examples', 'invalidos');
  const read = (file: string) => parseAutomatonJson(readFileSync(join(dir, file), 'utf8'));

  it('existem três arquivos de demonstração de erro', () => {
    expect(readdirSync(dir).sort()).toEqual([
      'afd-nao-deterministico.json',
      'especificacao-incompleta.json',
      'json-malformado.json',
    ]);
  });

  it('JSON malformado é rejeitado na leitura', () => {
    const parsed = read('json-malformado.json');
    expect(parsed.ok).toBe(false);
  });

  it('especificação incompleta lista os campos ausentes', () => {
    const parsed = read('especificacao-incompleta.json');
    expect(parsed.ok ? [] : parsed.errors).toEqual([
      'Campo obrigatório ausente: "alphabet".',
      'Campo obrigatório ausente: "finalStates".',
      'Campo obrigatório ausente: "initialState".',
      '"transitions[0]" está incompleta: "symbol" ausente(s) ou inválido(s).',
    ]);
  });

  it('AFD não determinístico é importado, mas não pode ser simulado', () => {
    const parsed = read('afd-nao-deterministico.json');
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const codes = validateAutomaton(parsed.value.definition).map((i) => i.code);
    expect(codes).toEqual(
      expect.arrayContaining(['NONDETERMINISTIC_TRANSITION', 'UNKNOWN_TRANSITION_TARGET', 'SYMBOL_NOT_IN_ALPHABET']),
    );
    expect(simulate(parsed.value.definition, 'a').result.reason).toBe('invalid-automaton');
  });
});
