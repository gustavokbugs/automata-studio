import { useState } from 'react';
import { Copy, Download, Trash2 } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import type { AutomatonProject } from '../../core/automata/types';
import { useProjectActions } from '../../hooks/useProjectActions';
import { useProjectStore } from '../../stores/projectStore';
import { useUiStore } from '../../stores/uiStore';
import { cn } from '../../utils/cn';

/** Lista "Meus autômatos" com ações de duplicar, exportar e excluir. */
export function ProjectList() {
  const projects = useProjectStore((s) => s.projects);
  const activeId = useProjectStore((s) => s.activeId);
  const openProject = useProjectStore((s) => s.openProject);
  const duplicateProject = useProjectStore((s) => s.duplicateProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const view = useUiStore((s) => s.view);
  const setView = useUiStore((s) => s.setView);
  const { exportProject } = useProjectActions();
  const [pendingDelete, setPendingDelete] = useState<AutomatonProject | null>(null);

  if (projects.length === 0) {
    return <p className="px-3 py-2 text-xs text-fg-subtle">Nenhum autômato ainda.</p>;
  }

  return (
    <>
      <ul className="space-y-0.5">
        {projects.map((project) => {
          const active = project.id === activeId && view === 'editor';
          return (
            <li key={project.id} className="group relative">
              <button
                type="button"
                onClick={() => {
                  openProject(project.id);
                  setView('editor');
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg py-1.5 pr-[76px] pl-2.5 text-left text-[13px] transition-colors',
                  active ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                )}
              >
                <span
                  className={cn(
                    'w-9 shrink-0 rounded px-1 py-px text-center font-mono text-[9.5px] font-bold',
                    project.definition.type === 'AFD' ? 'bg-accent-soft text-accent' : 'bg-warning-soft text-warning',
                  )}
                >
                  {project.definition.type}
                </span>
                <span className="truncate">{project.name}</span>
              </button>
              <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                <Button variant="ghost" size="icon-sm" className="h-6 w-6" aria-label="Duplicar" title="Duplicar" onClick={() => duplicateProject(project.id)}>
                  <Copy size={13} />
                </Button>
                <Button variant="ghost" size="icon-sm" className="h-6 w-6" aria-label="Exportar JSON" title="Exportar JSON" onClick={() => exportProject(project)}>
                  <Download size={13} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 hover:text-danger"
                  aria-label="Excluir"
                  title="Excluir"
                  onClick={() => setPendingDelete(project)}
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Excluir autômato?"
        description={
          <>
            <span className="font-medium text-fg">{pendingDelete?.name}</span> será removido do armazenamento local. Esta
            ação não pode ser desfeita — exporte o JSON antes se quiser guardar uma cópia.
          </>
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)} data-autofocus>
              Cancelar
            </Button>
            <Button
              className="bg-danger text-on-accent hover:opacity-90"
              onClick={() => {
                if (pendingDelete) deleteProject(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              <Trash2 size={15} /> Excluir
            </Button>
          </>
        }
      />
    </>
  );
}
