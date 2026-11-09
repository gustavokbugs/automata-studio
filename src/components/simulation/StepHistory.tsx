import { useEffect, useRef } from 'react';
import { CheckCircle2, CircleDot, XCircle } from 'lucide-react';
import { formatStateSet } from '../../core/automata/notation';
import type { ExecutionResult } from '../../core/simulation/types';
import { useSimulationStore } from '../../stores/simulationStore';
import { cn } from '../../utils/cn';

/**
 * Histórico das etapas já executadas. Clicar em uma etapa reposiciona a
 * simulação nela.
 */
export function StepHistory({ result, stepIndex }: { result: ExecutionResult; stepIndex: number }) {
  const goTo = useSimulationStore((s) => s.goTo);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [stepIndex]);

  const visible = result.steps.slice(0, stepIndex + 1);

  return (
    <ol className="space-y-0.5">
      {visible.map((step) => {
        const current = step.index === stepIndex;
        const Icon = step.status === 'accepted' ? CheckCircle2 : step.status === 'rejected' ? XCircle : CircleDot;
        const states =
          result.type === 'AFD'
            ? (step.activeStates[0] ?? '∅')
            : formatStateSet(step.activeStates);
        return (
          <li key={step.index}>
            <button
              ref={current ? activeRef : undefined}
              type="button"
              onClick={() => goTo(step.index)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left font-mono text-xs transition-colors',
                current ? 'bg-accent-soft text-fg' : 'text-fg-muted hover:bg-surface-2',
              )}
            >
              <Icon
                size={13}
                className={cn(
                  'shrink-0',
                  step.status === 'accepted' ? 'text-success' : step.status === 'rejected' ? 'text-danger' : current ? 'text-accent' : 'text-fg-subtle',
                )}
              />
              <span className="w-6 shrink-0 text-fg-subtle">{step.index}</span>
              <span className="w-5 shrink-0 text-center text-accent">{step.symbol ?? '·'}</span>
              <span className={cn('min-w-0 flex-1 truncate', step.activeStates.length === 0 && 'text-danger')}>{states}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
