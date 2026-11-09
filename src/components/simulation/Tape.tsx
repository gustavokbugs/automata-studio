import { EPSILON } from '../../core/automata/notation';
import { getTapeView } from '../../core/simulation/execution';
import type { ExecutionResult } from '../../core/simulation/types';
import { cn } from '../../utils/cn';

interface TapeProps {
  result: ExecutionResult | null;
  input: string;
  stepIndex: number;
  invalidPositions: ReadonlySet<number>;
}

/**
 * Fita de entrada: símbolos já processados, símbolo corrente (sob o cabeçote)
 * e símbolos ainda não processados.
 */
export function Tape({ result, input, stepIndex, invalidPositions }: TapeProps) {
  const symbols = result ? result.symbols : Array.from(input);
  const view = result ? getTapeView(result, stepIndex) : null;
  const head = view?.headPosition ?? null;
  const consumed = result?.steps[stepIndex]?.consumed ?? 0;

  if (symbols.length === 0) {
    return (
      <div className="flex h-12 items-center">
        <span className="flex h-10 min-w-10 items-center justify-center rounded-md border border-dashed border-line-strong px-3 font-mono text-sm text-fg-muted">
          {EPSILON}
        </span>
        <span className="ml-3 text-xs text-fg-subtle">Sentença vazia: aceita se q₀ ∈ F.</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex w-max items-end gap-1 pt-4">
        {symbols.map((symbol, position) => {
          const isHead = head === position;
          const processed = result !== null && position < consumed && !isHead;
          const invalid = invalidPositions.has(position);
          return (
            <div key={position} className="relative flex flex-col items-center">
              {isHead && (
                <span className="absolute -top-4 font-mono text-[10px] text-accent" aria-hidden>
                  ▼
                </span>
              )}
              <span
                className={cn(
                  'flex h-10 w-9 items-center justify-center rounded-md border font-mono text-base font-semibold transition-all duration-200',
                  isHead
                    ? invalid
                      ? 'border-danger bg-danger-soft text-danger'
                      : 'scale-105 border-accent bg-accent-soft text-accent shadow-[0_0_14px_var(--as-accent-soft)]'
                    : processed
                      ? 'border-line bg-surface-2 text-fg-subtle'
                      : invalid
                        ? 'border-warning/50 border-dashed text-warning'
                        : 'border-line-strong bg-surface text-fg',
                )}
              >
                {symbol === ' ' ? '␣' : symbol}
              </span>
              <span className="mt-1 font-mono text-[9px] text-fg-subtle">{position + 1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
