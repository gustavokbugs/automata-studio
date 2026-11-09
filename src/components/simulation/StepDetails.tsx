import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { formatStateSet } from '../../core/automata/notation';
import type { AutomatonType } from '../../core/automata/types';
import type { ExecutionStep, StepStatus } from '../../core/simulation/types';
import { cn } from '../../utils/cn';

const statusLabel: Record<StepStatus, { label: string; tone: 'accent' | 'success' | 'danger' }> = {
  running: { label: 'em execução', tone: 'accent' },
  accepted: { label: 'aceita', tone: 'success' },
  rejected: { label: 'rejeitada', tone: 'danger' },
};

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="mb-1 text-[10px] font-semibold tracking-[0.08em] text-fg-subtle uppercase">{label}</dt>
      <dd className="font-mono text-[13px] text-fg">{children}</dd>
    </div>
  );
}

interface StepDetailsProps {
  step: ExecutionStep;
  total: number;
  type: AutomatonType;
}

/** Detalhes da etapa corrente: símbolo, estados, transições e resultado parcial. */
export function StepDetails({ step, total, type }: StepDetailsProps) {
  const status = statusLabel[step.status];
  const stateLabel = type === 'AFD' ? 'Estado atual' : 'Estados ativos';
  const format = (states: readonly string[]) =>
    type === 'AFD' ? (states[0] ?? '—') : formatStateSet(states);

  return (
    <div className="animate-fade-in" key={step.index}>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm font-medium text-fg">
          {step.index === 0 ? 'Configuração inicial' : `Etapa ${step.index}`}
          <span className="text-fg-subtle"> de {total}</span>
        </span>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <Field label="Símbolo lido">
          {step.symbol === null ? <span className="text-fg-subtle">—</span> : <span className="text-accent">{step.symbol}</span>}
        </Field>
        <Field label={step.index === 0 ? stateLabel : `${stateLabel} (antes)`}>
          {step.index === 0 ? format(step.activeStates) : format(step.previousStates)}
        </Field>
        {step.index > 0 && (
          <Field label={`${stateLabel} (depois)`}>
            <span className={cn(step.activeStates.length === 0 && 'text-danger')}>
              {step.activeStates.length === 0 ? '∅' : format(step.activeStates)}
            </span>
          </Field>
        )}
        {step.transitions.length > 0 && (
          <Field label={step.transitions.length > 1 ? 'Transições realizadas' : 'Transição realizada'} className="col-span-full">
            <span className="flex flex-wrap gap-1.5">
              {step.transitions.map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 text-xs">
                  δ({t.from}, {t.symbol}) <ArrowRight size={11} className="text-fg-subtle" /> {t.to}
                </span>
              ))}
            </span>
          </Field>
        )}
        {step.discardedStates.length > 0 && step.index > 0 && (
          <Field label="Caminhos descartados" className="col-span-full">
            <span className="text-danger">
              {formatStateSet(step.discardedStates)}
              <span className="ml-2 font-sans text-xs text-fg-subtle">
                sem transição para '{step.symbol}'
              </span>
            </span>
          </Field>
        )}
      </dl>

      <p
        className={cn(
          'mt-3 rounded-lg border-l-2 bg-surface-2 px-3 py-2 font-mono text-xs leading-relaxed',
          step.status === 'accepted' ? 'border-success' : step.status === 'rejected' ? 'border-danger' : 'border-accent',
        )}
      >
        {step.description}
      </p>
    </div>
  );
}
