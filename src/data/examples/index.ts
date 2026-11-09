import { parseAutomatonObject, type ParsedAutomaton } from '../../core/automata/serialization';
import evenZerosJson from '../../../examples/afd-par-de-zeros.json';
import endsWith01Json from '../../../examples/afd-termina-em-01.json';
import contains01Json from '../../../examples/afnd-contem-01.json';
import secondToLastJson from '../../../examples/afnd-penultimo-1.json';

/** Sentença de demonstração com o veredito esperado. */
export interface SampleInput {
  input: string;
  accepted: boolean;
}

/** Autômato de demonstração disponível na galeria de exemplos. */
export interface AutomatonExample extends ParsedAutomaton {
  id: string;
  /** Linguagem reconhecida, em notação de conjunto. */
  language: string;
  samples: SampleInput[];
}

interface ExampleSource {
  id: string;
  json: unknown;
  language: string;
  samples: SampleInput[];
}

/**
 * Os exemplos são lidos dos mesmos arquivos JSON disponíveis em `examples/`,
 * passando pelo mesmo parser usado na importação.
 */
const sources: ExampleSource[] = [
  {
    id: 'afd-par-de-zeros',
    json: evenZerosJson,
    language: 'L = { w ∈ {0,1}* | w possui uma quantidade par de 0s }',
    samples: [
      { input: '1001', accepted: true },
      { input: '0110', accepted: true },
      { input: '', accepted: true },
      { input: '010', accepted: true },
      { input: '0', accepted: false },
      { input: '1000', accepted: false },
    ],
  },
  {
    id: 'afd-termina-em-01',
    json: endsWith01Json,
    language: 'L = { w01 | w ∈ {0,1}* }',
    samples: [
      { input: '01', accepted: true },
      { input: '1101', accepted: true },
      { input: '0001', accepted: true },
      { input: '10', accepted: false },
      { input: '011', accepted: false },
      { input: '', accepted: false },
    ],
  },
  {
    id: 'afnd-contem-01',
    json: contains01Json,
    language: 'L = { x01y | x, y ∈ {0,1}* }',
    samples: [
      { input: '1101', accepted: true },
      { input: '0010', accepted: true },
      { input: '01', accepted: true },
      { input: '1110', accepted: false },
      { input: '000', accepted: false },
      { input: '', accepted: false },
    ],
  },
  {
    id: 'afnd-penultimo-1',
    json: secondToLastJson,
    language: 'L = { w1a | w ∈ {0,1}*, a ∈ {0,1} }',
    samples: [
      { input: '10', accepted: true },
      { input: '0011', accepted: true },
      { input: '0110', accepted: true },
      { input: '01', accepted: false },
      { input: '1101', accepted: false },
      { input: '1', accepted: false },
    ],
  },
];

function load(source: ExampleSource): AutomatonExample {
  const parsed = parseAutomatonObject(source.json);
  if (!parsed.ok) {
    throw new Error(`Exemplo "${source.id}" inválido: ${parsed.errors.join(' ')}`);
  }
  return { ...parsed.value, id: source.id, language: source.language, samples: source.samples };
}

export const EXAMPLES: readonly AutomatonExample[] = sources.map(load);

export function findExample(id: string): AutomatonExample | undefined {
  return EXAMPLES.find((example) => example.id === id);
}
