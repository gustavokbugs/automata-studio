import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { EMPTY_SET, formatStateSet, sortStates } from '../../core/automata/notation';
import { serializeAutomaton } from '../../core/automata/serialization';
import type { AutomatonDefinition, AutomatonProject } from '../../core/automata/types';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

/** Linha "símbolo = valor" da quíntupla. */
function TupleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 font-mono text-[13px]">
      <span className="w-6 shrink-0 text-accent">{label}</span>
      <span className="text-fg-subtle">=</span>
      <span className="min-w-0 break-words text-fg">{value}</span>
    </div>
  );
}

/** Tabela de transição: linhas = estados, colunas = símbolos. */
export function TransitionTable({ definition, compact = false }: { definition: AutomatonDefinition; compact?: boolean }) {
  const states = [...new Set(definition.states)];
  const alphabet = [...new Set(definition.alphabet)];
  const finals = new Set(definition.finalStates);

  if (states.length === 0 || alphabet.length === 0) {
    return <p className="text-xs text-fg-subtle">A tabela aparece quando Q e Σ não estão vazios.</p>;
  }

  const cell = (state: string, symbol: string) => {
    const targets = sortStates(
      definition,
      definition.transitions.filter((t) => t.from === state && t.symbol === symbol).map((t) => t.to),
    );
    if (definition.type === 'AFND') return formatStateSet(targets);
    if (targets.length === 0) return '—';
    return targets.length === 1 ? (targets[0] as string) : formatStateSet(targets);
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className={cn('w-full border-collapse font-mono', compact ? 'text-xs' : 'text-[13px]')}>
        <thead>
          <tr className="bg-surface-2 text-fg-muted">
            <th className="border-b border-line px-3 py-1.5 text-left font-medium">δ</th>
            {alphabet.map((symbol) => (
              <th key={symbol} className="border-b border-l border-line px-3 py-1.5 text-center font-semibold text-accent">
                {symbol}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {states.map((state) => (
            <tr key={state} className="odd:bg-surface even:bg-surface-2/40">
              <td className="border-t border-line px-3 py-1.5 whitespace-nowrap">
                <span className="inline-block w-7 text-fg-subtle">
                  {definition.initialState === state ? '→' : ''}
                  {finals.has(state) ? '*' : ''}
                </span>
                <span className="text-fg">{state}</span>
              </td>
              {alphabet.map((symbol) => {
                const value = cell(state, symbol);
                const empty = value === '—' || value === EMPTY_SET;
                return (
                  <td
                    key={symbol}
                    className={cn(
                      'border-t border-l border-line px-3 py-1.5 text-center whitespace-nowrap',
                      empty ? 'text-fg-subtle' : 'text-fg',
                      definition.type === 'AFD' && value.startsWith('{') && 'bg-danger-soft text-danger',
                    )}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Quíntupla formal M = (Q, Σ, δ, q₀, F). */
export function TupleView({ definition }: { definition: AutomatonDefinition }) {
  return (
    <div className="space-y-1.5">
      <p className="mb-2 font-mono text-sm text-fg">
        M = (Q, Σ, δ, q₀, F) <span className="text-fg-subtle">— {definition.type}</span>
      </p>
      <TupleRow label="Q" value={formatStateSet(definition.states)} />
      <TupleRow label="Σ" value={formatStateSet(definition.alphabet)} />
      <TupleRow label="q₀" value={definition.initialState ?? '— (não definido)'} />
      <TupleRow label="F" value={formatStateSet(definition.finalStates)} />
      <TupleRow label="δ" value={`Q × Σ → ${definition.type === 'AFD' ? 'Q' : 'P(Q)'}`} />
    </div>
  );
}

/** Especificação completa: quíntupla, tabela δ e JSON exportável. */
export function FormalSpec({ project }: { project: AutomatonProject }) {
  const [copied, setCopied] = useState(false);
  const json = serializeAutomaton(project);

  const copy = () => {
    void navigator.clipboard?.writeText(json).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="space-y-5 px-4 py-4">
      <TupleView definition={project.definition} />
      <div>
        <h4 className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-fg-subtle uppercase">
          Tabela de transição <span className="normal-case tracking-normal">(→ inicial, * final)</span>
        </h4>
        <TransitionTable definition={project.definition} />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-[11px] font-semibold tracking-[0.08em] text-fg-subtle uppercase">Especificação JSON</h4>
          <Button size="sm" variant="ghost" onClick={copy}>
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copiado' : 'Copiar'}
          </Button>
        </div>
        <pre className="max-h-72 overflow-auto rounded-lg border border-line bg-canvas p-3 font-mono text-[11.5px] leading-relaxed text-fg-muted">
          {json}
        </pre>
      </div>
    </div>
  );
}
