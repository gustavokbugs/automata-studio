import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import type { AutomatonDefinition } from '../../core/automata/types';
import { isLastStep } from '../../core/simulation/execution';
import { PLAYBACK_SPEEDS, useSimulationStore } from '../../stores/simulationStore';
import { cn } from '../../utils/cn';

interface PlaybackControlsProps {
  definition: AutomatonDefinition;
  disabled: boolean;
}

/** Controles: executar, reiniciar, anterior, executar automaticamente/pausar, próxima e velocidade. */
export function PlaybackControls({ definition, disabled }: PlaybackControlsProps) {
  const { result, stepIndex, playing, speedMs } = useSimulationStore();
  const { run, restart, previous, next, play, pause, setSpeed } = useSimulationStore.getState();

  const atStart = !result || stepIndex === 0;
  const atEnd = result ? isLastStep(result, stepIndex) : false;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button variant="primary" onClick={() => run(definition)} disabled={disabled} title="Executar toda a sentença (Enter)">
        <Zap size={15} /> Executar
      </Button>

      <div className="flex items-center rounded-lg border border-line bg-surface-2 p-0.5">
        <Button variant="ghost" size="icon-sm" onClick={restart} disabled={disabled || atStart} aria-label="Reiniciar" title="Reiniciar (Home)">
          <RotateCcw size={15} />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={previous} disabled={disabled || atStart} aria-label="Etapa anterior" title="Etapa anterior (←)">
          <ChevronLeft size={17} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => (playing ? pause() : play(definition))}
          disabled={disabled}
          aria-label={playing ? 'Pausar' : 'Executar automaticamente'}
          title={playing ? 'Pausar (espaço)' : 'Executar automaticamente (espaço)'}
          className={cn(playing && 'bg-accent-soft text-accent')}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            pause();
            next(definition);
          }}
          disabled={disabled || atEnd}
          aria-label="Próxima etapa"
          title="Próxima etapa (→)"
        >
          <ChevronRight size={17} />
        </Button>
      </div>

      <div className="flex items-center rounded-lg border border-line bg-surface-2 p-0.5" role="group" aria-label="Velocidade">
        {PLAYBACK_SPEEDS.map((speed) => (
          <button
            key={speed.ms}
            type="button"
            onClick={() => setSpeed(speed.ms)}
            className={cn(
              'h-7 rounded-md px-2 font-mono text-[11px] transition-colors',
              speedMs === speed.ms ? 'bg-surface-3 text-fg' : 'text-fg-subtle hover:text-fg',
            )}
          >
            {speed.label}
          </button>
        ))}
      </div>
    </div>
  );
}
