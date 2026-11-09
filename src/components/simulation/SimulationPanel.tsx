import { useMemo } from 'react';
import { AlertOctagon, History, ListChecks, PlayCircle } from 'lucide-react';
import { SentenceInput } from './SentenceInput';
import { PlaybackControls } from './PlaybackControls';
import { Tape } from './Tape';
import { StepDetails } from './StepDetails';
import { StepHistory } from './StepHistory';
import { ResultCard } from './ResultCard';
import { Button } from '../ui/Button';
import { hasErrors, validateSentence } from '../../core/automata/validation';
import { getStep, isLastStep } from '../../core/simulation/execution';
import type { AutomatonDefinition, ValidationIssue } from '../../core/automata/types';
import { useSimulationStore } from '../../stores/simulationStore';
import { useUiStore } from '../../stores/uiStore';
import { usePlayback } from '../../hooks/usePlayback';

function ColumnTitle({ icon: Icon, children }: { icon: typeof History; children: string }) {
  return (
    <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] text-fg-subtle uppercase">
      <Icon size={13} /> {children}
    </h3>
  );
}

interface SimulationPanelProps {
  definition: AutomatonDefinition;
  issues: readonly ValidationIssue[];
}

/** Área de simulação: entrada, controles, fita, etapa corrente, histórico e resultado. */
export function SimulationPanel({ definition, issues }: SimulationPanelProps) {
  const input = useSimulationStore((s) => s.input);
  const result = useSimulationStore((s) => s.result);
  const stepIndex = useSimulationStore((s) => s.stepIndex);
  const setInspectorTab = useUiStore((s) => s.setInspectorTab);

  const blocked = hasErrors(issues);
  usePlayback(blocked ? null : definition, !blocked);

  const invalidPositions = useMemo(
    () => new Set(validateSentence(definition, input).map((i) => i.position)),
    [definition, input],
  );

  const step = result ? getStep(result, stepIndex) : null;
  const finished = result ? isLastStep(result, stepIndex) : false;
  const total = result ? Math.max(result.steps.length - 1, 0) : 0;

  return (
    <section className="flex h-full min-h-0 flex-col bg-surface" aria-label="Simulação">
      <div className="flex flex-col gap-2 border-b border-line px-4 py-3 xl:flex-row xl:items-start">
        <SentenceInput definition={definition} disabled={blocked} />
        <PlaybackControls definition={definition} disabled={blocked} />
      </div>

      {blocked ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="flex max-w-md flex-col items-center gap-2 text-center">
            <AlertOctagon size={26} className="text-danger" />
            <p className="text-sm font-medium text-fg">O autômato possui erros de especificação</p>
            <p className="text-xs text-fg-muted">Corrija-os para poder processar sentenças.</p>
            <Button size="sm" className="mt-1" onClick={() => setInspectorTab('issues')}>
              Ver validação
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,1.5fr)_minmax(200px,0.8fr)_minmax(260px,1fr)] lg:overflow-hidden">
          <div className="min-h-0 border-line p-4 lg:overflow-y-auto lg:border-r">
            <ColumnTitle icon={PlayCircle}>Fita e etapa atual</ColumnTitle>
            <Tape result={result} input={input} stepIndex={stepIndex} invalidPositions={invalidPositions} />
            <div className="mt-3">
              {step && result ? (
                <StepDetails
                  step={step}
                  total={total}
                  type={result.type}
                  invalidSymbol={finished && result.reason === 'invalid-symbol'}
                />
              ) : (
                <p className="text-sm text-fg-muted">
                  Digite uma sentença e use <span className="font-medium text-fg">Executar</span>, a{' '}
                  <span className="font-medium text-fg">próxima etapa</span> ou a{' '}
                  <span className="font-medium text-fg">execução automática</span> para acompanhar o processamento.
                  <span className="mt-2 block text-xs text-fg-subtle">Atalhos: ← → etapas · espaço executar/pausar · Home reiniciar</span>
                </p>
              )}
            </div>
          </div>

          <div className="min-h-0 border-t border-line p-4 lg:overflow-y-auto lg:border-t-0 lg:border-r">
            <ColumnTitle icon={History}>Histórico</ColumnTitle>
            {result ? (
              <StepHistory result={result} stepIndex={stepIndex} />
            ) : (
              <p className="text-xs text-fg-subtle">As etapas executadas aparecerão aqui.</p>
            )}
          </div>

          <div className="min-h-0 border-t border-line p-4 lg:overflow-y-auto lg:border-t-0">
            <ColumnTitle icon={ListChecks}>Resultado</ColumnTitle>
            {result && finished ? (
              <ResultCard result={result} />
            ) : result ? (
              <div className="space-y-2">
                <p className="text-sm text-fg-muted">
                  Processando… etapa {stepIndex} de {total}.
                </p>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${total === 0 ? 100 : (stepIndex / total) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-fg-subtle">O veredito aparece ao final do processamento.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
