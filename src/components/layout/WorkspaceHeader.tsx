import { useEffect, useState } from 'react';
import { CheckCircle2, Copy, Download, Menu, TriangleAlert, XCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { AutomatonProject, ValidationIssue } from '../../core/automata/types';
import { useProjectActions } from '../../hooks/useProjectActions';
import { useProjectStore } from '../../stores/projectStore';
import { useUiStore } from '../../stores/uiStore';

/** Botão que abre a barra lateral em telas pequenas. */
export function MenuButton() {
  const setOpen = useUiStore((s) => s.setSidebarOpen);
  return (
    <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu" onClick={() => setOpen(true)}>
      <Menu size={18} />
    </Button>
  );
}

function ValidationStatus({ issues }: { issues: readonly ValidationIssue[] }) {
  const setTab = useUiStore((s) => s.setInspectorTab);
  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.length - errors;

  const [Icon, text, tone] =
    errors > 0
      ? ([XCircle, `${errors} erro${errors > 1 ? 's' : ''}`, 'text-danger'] as const)
      : warnings > 0
        ? ([TriangleAlert, `${warnings} aviso${warnings > 1 ? 's' : ''}`, 'text-warning'] as const)
        : ([CheckCircle2, 'Válido', 'text-success'] as const);

  return (
    <button
      type="button"
      onClick={() => setTab('issues')}
      className={`hidden items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors hover:bg-surface-2 sm:flex ${tone}`}
      title="Ver validação"
    >
      <Icon size={14} /> {text}
    </button>
  );
}

/** Cabeçalho da área de trabalho: nome editável, tipo, status e ações. */
export function WorkspaceHeader({ project, issues }: { project: AutomatonProject; issues: readonly ValidationIssue[] }) {
  const renameProject = useProjectStore((s) => s.renameProject);
  const duplicateProject = useProjectStore((s) => s.duplicateProject);
  const { exportProject } = useProjectActions();
  const [name, setName] = useState(project.name);

  useEffect(() => setName(project.name), [project.name]);

  const commit = () => {
    if (name.trim()) renameProject(project.id, name);
    else setName(project.name);
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 sm:px-4">
      <MenuButton />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') {
            setName(project.name);
            e.currentTarget.blur();
          }
        }}
        aria-label="Nome do autômato"
        className="min-w-0 flex-1 truncate rounded-md bg-transparent px-1.5 py-1 text-[15px] font-semibold text-fg hover:bg-surface-2 focus:bg-surface-2 focus:ring-2 focus:ring-accent-soft focus:outline-none sm:max-w-md"
      />
      <Badge tone={project.definition.type === 'AFD' ? 'accent' : 'warning'} title={project.definition.type === 'AFD' ? 'Autômato Finito Determinístico' : 'Autômato Finito Não Determinístico'}>
        {project.definition.type}
      </Badge>
      <ValidationStatus issues={issues} />
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => duplicateProject(project.id)} title="Duplicar autômato">
          <Copy size={14} /> <span className="hidden md:inline">Duplicar</span>
        </Button>
        <Button size="sm" onClick={() => exportProject(project)} title="Exportar especificação JSON">
          <Download size={14} /> <span className="hidden md:inline">Exportar JSON</span>
        </Button>
      </div>
    </header>
  );
}
