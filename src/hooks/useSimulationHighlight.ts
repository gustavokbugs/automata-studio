import { useMemo } from 'react';
import type { StateName, Transition } from '../core/automata/types';
import { getStep } from '../core/simulation/execution';
import type { StepStatus } from '../core/simulation/types';
import { useSimulationStore } from '../stores/simulationStore';

/** Informações da etapa corrente usadas para colorir o grafo. */
export interface SimulationHighlight {
  active: ReadonlySet<StateName>;
  discarded: ReadonlySet<StateName>;
  transitions: readonly Transition[];
  status: StepStatus;
}

/** Deriva, da etapa corrente da simulação, o que deve ser destacado no grafo. */
export function useSimulationHighlight(): SimulationHighlight | null {
  const result = useSimulationStore((s) => s.result);
  const stepIndex = useSimulationStore((s) => s.stepIndex);

  return useMemo(() => {
    if (!result) return null;
    const step = getStep(result, stepIndex);
    if (!step) return null;
    return {
      active: new Set(step.activeStates),
      discarded: new Set(step.discardedStates),
      transitions: step.transitions,
      status: step.status,
    };
  }, [result, stepIndex]);
}
