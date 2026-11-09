import { Badge } from '../ui/Badge';
import { Tabs } from '../ui/Tabs';
import { FormalSpec } from '../automata/FormalSpec';
import { ValidationList } from '../automata/ValidationList';
import { SelectionSection } from './properties/SelectionSection';
import { ProjectSection } from './properties/ProjectSection';
import { StatesSection } from './properties/StatesSection';
import { AlphabetSection } from './properties/AlphabetSection';
import { TransitionsSection } from './properties/TransitionsSection';
import type { AutomatonProject, ValidationIssue } from '../../core/automata/types';
import { useUiStore, type InspectorTab } from '../../stores/uiStore';

interface InspectorProps {
  project: AutomatonProject;
  issues: readonly ValidationIssue[];
}

/** Painel lateral: configuração, especificação formal e validação. */
export function Inspector({ project, issues }: InspectorProps) {
  const tab = useUiStore((s) => s.inspectorTab);
  const setTab = useUiStore((s) => s.setInspectorTab);
  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.length - errors;

  return (
    <aside className="flex min-h-0 flex-col bg-surface">
      <div className="border-b border-line p-2.5">
        <Tabs<InspectorTab>
          className="w-full"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'config', label: 'Configuração' },
            { value: 'spec', label: 'Especificação' },
            {
              value: 'issues',
              label: (
                <>
                  Validação
                  {errors > 0 ? (
                    <Badge tone="danger">{errors}</Badge>
                  ) : warnings > 0 ? (
                    <Badge tone="warning">{warnings}</Badge>
                  ) : null}
                </>
              ),
            },
          ]}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'config' && (
          <>
            <SelectionSection definition={project.definition} />
            <ProjectSection project={project} />
            <StatesSection definition={project.definition} />
            <AlphabetSection definition={project.definition} />
            <TransitionsSection definition={project.definition} issues={issues} />
          </>
        )}
        {tab === 'spec' && <FormalSpec project={project} />}
        {tab === 'issues' && (
          <div className="p-4">
            <ValidationList issues={issues} />
          </div>
        )}
      </div>
    </aside>
  );
}
