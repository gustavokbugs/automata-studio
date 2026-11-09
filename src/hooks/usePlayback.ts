import { useEffect } from 'react';
import type { AutomatonDefinition } from '../core/automata/types';
import { useSimulationStore } from '../stores/simulationStore';

/**
 * Avança automaticamente a simulação enquanto `playing` estiver ativo e
 * registra atalhos de teclado (fora de campos de texto):
 *   →  próxima etapa · ←  etapa anterior · espaço  executar/pausar · Home  reiniciar
 */
export function usePlayback(definition: AutomatonDefinition | null, enabled: boolean) {
  const playing = useSimulationStore((s) => s.playing);
  const speedMs = useSimulationStore((s) => s.speedMs);
  const stepIndex = useSimulationStore((s) => s.stepIndex);

  useEffect(() => {
    if (!playing || !definition) return;
    const timer = window.setTimeout(() => useSimulationStore.getState().next(definition), speedMs);
    return () => window.clearTimeout(timer);
  }, [playing, speedMs, stepIndex, definition]);

  useEffect(() => {
    if (!definition || !enabled) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const sim = useSimulationStore.getState();
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          sim.pause();
          sim.next(definition);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          sim.previous();
          break;
        case ' ':
          event.preventDefault();
          if (sim.playing) sim.pause();
          else sim.play(definition);
          break;
        case 'Home':
          event.preventDefault();
          sim.restart();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [definition, enabled]);
}
