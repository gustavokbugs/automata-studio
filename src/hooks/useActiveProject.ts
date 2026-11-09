import { useCallback, useMemo } from 'react';
import type { EditableAutomaton } from '../core/automata/operations';
import { validateAutomaton } from '../core/automata/validation';
import { selectActiveProject, useProjectStore } from '../stores/projectStore';

/**
 * Projeto ativo, função de edição e problemas de validação (recalculados
 * apenas quando a definição formal muda — mover nós não revalida).
 */
export function useActiveProject() {
  const project = useProjectStore(selectActiveProject);
  const editProject = useProjectStore((s) => s.editProject);
  const projectId = project?.id ?? null;

  const edit = useCallback(
    (operation: (automaton: EditableAutomaton) => EditableAutomaton) => {
      if (projectId) editProject(projectId, operation);
    },
    [projectId, editProject],
  );

  const definition = project?.definition;
  const issues = useMemo(() => (definition ? validateAutomaton(definition) : []), [definition]);

  return { project, edit, issues };
}
