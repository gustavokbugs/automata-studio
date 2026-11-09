import { create } from 'zustand';
import type { AutomatonDefinition } from '../core/automata/types';
import { clampStep, isLastStep } from '../core/simulation/execution';
import { simulate } from '../core/simulation/simulator';
import type { ExecutionResult } from '../core/simulation/types';

/** Velocidades disponíveis para a execução automática (ms por etapa). */
export const PLAYBACK_SPEEDS = [
  { label: '0,5×', ms: 1600 },
  { label: '1×', ms: 900 },
  { label: '2×', ms: 450 },
  { label: '4×', ms: 220 },
] as const;

/**
 * Estado da simulação. A computação inteira é feita de uma vez pelo núcleo
 * (`simulate`), gerando um trace imutável; a interface apenas move o cursor
 * `stepIndex` sobre esse trace. Isso torna "voltar etapa" trivial e garante
 * que a animação nunca diverge do algoritmo.
 */
interface SimulationState {
  input: string;
  result: ExecutionResult | null;
  stepIndex: number;
  playing: boolean;
  speedMs: number;

  setInput: (input: string) => void;
  /** Executa tudo e exibe o resultado final. */
  run: (definition: AutomatonDefinition) => void;
  /** Avança uma etapa (calcula o trace se necessário). */
  next: (definition: AutomatonDefinition) => void;
  /** Volta uma etapa. */
  previous: () => void;
  /** Vai para uma etapa específica. */
  goTo: (index: number) => void;
  /** Inicia a execução automática. */
  play: (definition: AutomatonDefinition) => void;
  pause: () => void;
  /** Volta para a configuração inicial. */
  restart: () => void;
  setSpeed: (ms: number) => void;
  /** Descarta o trace (ex.: quando o autômato é editado). */
  invalidate: () => void;
}

const compute = (definition: AutomatonDefinition, input: string) => simulate(definition, input).result;

export const useSimulationStore = create<SimulationState>()((set, get) => ({
  input: '',
  result: null,
  stepIndex: 0,
  playing: false,
  speedMs: 900,

  setInput: (input) => set({ input, result: null, stepIndex: 0, playing: false }),

  run: (definition) => {
    const result = compute(definition, get().input);
    set({ result, stepIndex: Math.max(result.steps.length - 1, 0), playing: false });
  },

  next: (definition) => {
    const { result, stepIndex, input } = get();
    if (!result) {
      set({ result: compute(definition, input), stepIndex: 0 });
      return;
    }
    if (isLastStep(result, stepIndex)) {
      set({ playing: false });
      return;
    }
    const nextIndex = clampStep(result, stepIndex + 1);
    set({ stepIndex: nextIndex, playing: get().playing && !isLastStep(result, nextIndex) });
  },

  previous: () => {
    const { result, stepIndex } = get();
    if (!result) return;
    set({ stepIndex: clampStep(result, stepIndex - 1), playing: false });
  },

  goTo: (index) => {
    const { result } = get();
    if (!result) return;
    set({ stepIndex: clampStep(result, index), playing: false });
  },

  play: (definition) => {
    const { result, stepIndex, input } = get();
    if (!result) {
      const fresh = compute(definition, input);
      set({ result: fresh, stepIndex: 0, playing: fresh.steps.length > 1 });
      return;
    }
    // Ao chegar ao fim, "executar automaticamente" recomeça do início.
    const restart = isLastStep(result, stepIndex);
    set({ stepIndex: restart ? 0 : stepIndex, playing: result.steps.length > 1 });
  },

  pause: () => set({ playing: false }),

  restart: () => set({ stepIndex: 0, playing: false }),

  setSpeed: (speedMs) => set({ speedMs }),

  invalidate: () => set({ result: null, stepIndex: 0, playing: false }),
}));
