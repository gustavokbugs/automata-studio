/**
 * Interface de linha de comando do Automata Studio.
 *
 * Uso:
 *   npm run cli -- <arquivo.json> [sentença ...]
 *
 * Exemplos:
 *   npm run cli -- examples/afd-par-de-zeros.json 1001
 *   npm run cli -- examples/afnd-contem-01.json 1101 111 ""
 *
 * Reutiliza exatamente o mesmo núcleo (src/core) da interface gráfica.
 */
import { readFileSync } from 'node:fs';
import { formatSentence, formatStateSet } from '../src/core/automata/notation';
import { parseAutomatonJson } from '../src/core/automata/serialization';
import { hasErrors, validateAutomaton } from '../src/core/automata/validation';
import { simulate } from '../src/core/simulation/simulator';
import type { AutomatonDefinition } from '../src/core/automata/types';
import type { ExecutionResult } from '../src/core/simulation/types';

const color = process.stdout.isTTY
  ? {
      green: (s: string) => `\x1b[32m${s}\x1b[0m`,
      red: (s: string) => `\x1b[31m${s}\x1b[0m`,
      yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
      dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
      bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
    }
  : { green: String, red: String, yellow: String, dim: String, bold: String };

function printDefinition(name: string, def: AutomatonDefinition): void {
  console.log(color.bold(`${name} (${def.type})`));
  console.log(`  Q  = ${formatStateSet(def.states)}`);
  console.log(`  Σ  = ${formatStateSet(def.alphabet)}`);
  console.log(`  q₀ = ${def.initialState ?? '—'}`);
  console.log(`  F  = ${formatStateSet(def.finalStates)}`);
  console.log('  δ  =');
  for (const t of def.transitions) console.log(`       δ(${t.from}, ${t.symbol}) → ${t.to}`);
  console.log();
}

function printExecution(result: ExecutionResult): void {
  console.log(color.bold(`Sentença: ${formatSentence(result.input)}`));
  for (const step of result.steps) {
    const tape =
      step.position === null
        ? `▸${result.symbols.join('')}`
        : `${result.symbols.slice(0, step.position).join('')}[${step.symbol}]${result.symbols.slice(step.position + 1).join('')}`;
    const label = step.index === 0 ? 'início' : `etapa ${step.index}`;
    console.log(`  ${label.padEnd(9)} ${color.dim(tape.padEnd(Math.max(result.symbols.length + 3, 8)))}  ${step.description}`);
    if (step.discardedStates.length > 0 && step.status !== 'rejected') {
      console.log(`  ${''.padEnd(9)} ${''.padEnd(Math.max(result.symbols.length + 3, 8))}  ${color.dim(`caminhos descartados: ${formatStateSet(step.discardedStates)}`)}`);
    }
  }
  if (result.path) console.log(`  Caminho: ${result.path.join(' → ')}`);
  const verdict = result.accepted ? color.green('✔ ACEITA') : color.red('✘ REJEITADA');
  console.log(`  ${verdict} — ${result.summary}`);
  console.log(`  Símbolos processados: ${result.processedSymbols}/${result.symbols.length}\n`);
}

function main(argv: string[]): number {
  const [file, ...inputs] = argv;
  if (!file) {
    console.error('Uso: npm run cli -- <arquivo.json> [sentença ...]');
    return 2;
  }

  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    console.error(color.red(`Não foi possível ler o arquivo "${file}".`));
    return 2;
  }

  const parsed = parseAutomatonJson(text);
  if (!parsed.ok) {
    console.error(color.red('Especificação inválida:'));
    for (const error of parsed.errors) console.error(`  • ${error}`);
    return 1;
  }

  const { name, definition } = parsed.value;
  printDefinition(name, definition);

  const issues = validateAutomaton(definition);
  for (const issue of issues) {
    const tag = issue.severity === 'error' ? color.red('erro ') : color.yellow('aviso');
    console.log(`  ${tag} ${issue.message}`);
  }
  if (issues.length > 0) console.log();
  if (hasErrors(issues)) return 1;

  if (inputs.length === 0) {
    console.log(color.dim('Nenhuma sentença informada. Ex.: npm run cli -- arquivo.json 0101'));
    return 0;
  }

  for (const input of inputs) {
    printExecution(simulate(definition, input).result);
  }
  return 0;
}

process.exitCode = main(process.argv.slice(2));
