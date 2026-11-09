import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { WorkspaceHeader } from '../components/layout/WorkspaceHeader';
import { AutomatonCanvas } from '../components/editor/AutomatonCanvas';
import { Inspector } from '../components/editor/Inspector';
import { TransitionDialog } from '../components/editor/TransitionDialog';
import { SimulationPanel } from '../components/simulation/SimulationPanel';
import { WelcomePage } from './WelcomePage';
import { useActiveProject } from '../hooks/useActiveProject';
import { useSimulationStore } from '../stores/simulationStore';
import { useUiStore } from '../stores/uiStore';

/**
 * Área de trabalho: editor visual (centro), simulação (abaixo) e painel de
 * propriedades (direita). Em telas pequenas, os painéis são empilhados.
 */
export function EditorPage() {
  const { project, issues } = useActiveProject();
  const invalidate = useSimulationStore((s) => s.invalidate);
  const select = useUiStore((s) => s.select);

  const definition = project?.definition;
  const projectId = project?.id;

  // Qualquer alteração na definição formal torna o trace anterior obsoleto.
  useEffect(() => invalidate(), [definition, invalidate]);
  useEffect(() => select(null), [projectId, select]);

  if (!project) return <WelcomePage />;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WorkspaceHeader project={project} issues={issues} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <div className="flex min-w-0 flex-col lg:min-h-0 lg:flex-1">
          <div className="relative h-[440px] shrink-0 bg-canvas lg:h-auto lg:min-h-0 lg:flex-1">
            <ReactFlowProvider>
              <AutomatonCanvas project={project} issues={issues} />
            </ReactFlowProvider>
          </div>
          <div className="shrink-0 border-t border-line lg:h-[clamp(270px,40vh,400px)]">
            <SimulationPanel definition={project.definition} issues={issues} />
          </div>
        </div>
        <div className="flex shrink-0 flex-col border-t border-line lg:min-h-0 lg:w-[340px] lg:border-t-0 lg:border-l xl:w-[370px]">
          <Inspector project={project} issues={issues} />
        </div>
      </div>
      <TransitionDialog />
    </div>
  );
}
