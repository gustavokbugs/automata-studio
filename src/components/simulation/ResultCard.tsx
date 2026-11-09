import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { formatSentence, formatStateSet } from '../../core/automata/notation';
import { countComputationSteps } from '../../core/simulation/execution';
import type { ExecutionResult, HaltReason } from '../../core/simulation/types';
import { cn } from '../../utils/cn';

const reasonLabel: Record<HaltReason, string> = {
  accepted: 'terminou em estado final',
  'not-final': 'terminou fora de F',
  'no-transition': 'δ indefinida',
  'empty-active-set': 'nenhum estado ativo',
  'invalid-symbol': 'símbolo fora de Σ',
  'invalid-automaton': 'autômato inválido',
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2 px-2.5 py-1.5">
      <p className="text-[10px] text-fg-subtle">{label}</p>
      <p className="font-mono text-sm text-fg">{value}</p>
    </div>
  );
}

/** Resultado final: veredito, estatísticas e caminho (AFD) ou conjuntos (AFND). */
export function ResultCard({ result }: { result: ExecutionResult }) {
  const accepted = result.accepted;
  const Icon = accepted ? CheckCircle2 : XCircle;
  const path = result.path;

  return (
    <div className="animate-fade-in space-y-3">
      <div
        className={cn(
          'flex items-start gap-3 rounded-xl border px-3.5 py-3',
          accepted ? 'border-success/40 bg-success-soft' : 'border-danger/40 bg-danger-soft',
        )}
      >
        <Icon size={26} className={cn('shrink-0', accepted ? 'text-success' : 'text-danger')} />
        <div className="min-w-0">
          <p className={cn('text-base font-semibold', accepted ? 'text-success' : 'text-danger')}>
            Sentença {accepted ? 'aceita' : 'rejeitada'}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{result.summary}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Sentença" value={formatSentence(result.input)} />
        <Stat label="Símbolos processados" value={`${result.processedSymbols}/${result.symbols.length}`} />
        <Stat label="Etapas" value={String(countComputationSteps(result))} />
      </div>

      <p className="text-[11px] text-fg-subtle">Motivo da parada: {reasonLabel[result.reason]}</p>

      {path && path.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold tracking-[0.08em] text-fg-subtle uppercase">Caminho percorrido</p>
          <div className="flex flex-wrap items-center gap-1 font-mono text-xs">
            {path.map((state, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && (
                  <span className="flex items-center text-fg-subtle">
                    <span className="text-[10px] text-accent">{result.symbols[i - 1]}</span>
                    <ArrowRight size={11} />
                  </span>
                )}
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.5',
                    i === path.length - 1 ? (accepted ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger') : 'bg-surface-2 text-fg',
                  )}
                >
                  {state}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {result.type === 'AFND' && result.activeSets.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold tracking-[0.08em] text-fg-subtle uppercase">
            Estados ativos por etapa
          </p>
          <ol className="space-y-0.5 font-mono text-xs">
            {result.activeSets.map((set, i) => (
              <li key={i} className="flex gap-2">
                <span className="w-12 shrink-0 text-fg-subtle">S{toSubscript(i)}</span>
                <span className="w-4 shrink-0 text-accent">{i === 0 ? '' : result.symbols[i - 1]}</span>
                <span className={cn(set.length === 0 ? 'text-danger' : 'text-fg')}>{formatStateSet(set)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉';
function toSubscript(n: number): string {
  return String(n)
    .split('')
    .map((d) => SUBSCRIPTS[Number(d)] ?? d)
    .join('');
}
