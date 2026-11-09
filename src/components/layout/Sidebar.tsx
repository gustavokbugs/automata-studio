import type { ReactNode } from 'react';
import { BookOpen, FileUp, Moon, Plus, Shapes, Sun, X } from 'lucide-react';
import { Logo } from './Logo';
import { Button } from '../ui/Button';
import { ProjectList } from '../automata/ProjectList';
import { useProjectActions } from '../../hooks/useProjectActions';
import { useProjectStore } from '../../stores/projectStore';
import { useUiStore, type View } from '../../stores/uiStore';
import { cn } from '../../utils/cn';

function NavItem({ icon, label, view }: { icon: ReactNode; label: string; view: View }) {
  const current = useUiStore((s) => s.view);
  const setView = useUiStore((s) => s.setView);
  return (
    <button
      type="button"
      onClick={() => setView(view)}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors',
        current === view ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/** Barra lateral: marca, criação/importação, meus autômatos, exemplos e documentação. */
export function Sidebar() {
  const open = useUiStore((s) => s.sidebarOpen);
  const setOpen = useUiStore((s) => s.setSidebarOpen);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const setNewProjectOpen = useUiStore((s) => s.setNewProjectOpen);
  const count = useProjectStore((s) => s.projects.length);
  const { importFromFile } = useProjectActions();

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <Logo />
          <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Fechar menu" onClick={() => setOpen(false)}>
            <X size={16} />
          </Button>
        </div>

        <div className="flex gap-1.5 px-3 pb-3">
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => {
              setNewProjectOpen(true);
              setOpen(false);
            }}
          >
            <Plus size={16} /> Novo autômato
          </Button>
          <Button size="icon" aria-label="Importar JSON" title="Importar especificação JSON" onClick={() => void importFromFile()}>
            <FileUp size={16} />
          </Button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3">
          <p className="mt-2 mb-1.5 flex items-center justify-between px-2.5 text-[11px] font-semibold tracking-[0.08em] text-fg-subtle uppercase">
            Meus autômatos <span className="font-mono tracking-normal">{count}</span>
          </p>
          <ProjectList />

          <p className="mt-5 mb-1.5 px-2.5 text-[11px] font-semibold tracking-[0.08em] text-fg-subtle uppercase">Aprender</p>
          <div className="space-y-0.5">
            <NavItem icon={<Shapes size={15} />} label="Exemplos" view="examples" />
            <NavItem icon={<BookOpen size={15} />} label="Documentação" view="docs" />
          </div>
        </nav>

        <div className="flex items-center justify-between border-t border-line px-4 py-3">
          <span className="text-[11px] text-fg-subtle">Computabilidade · 2026</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
            title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </Button>
        </div>
      </aside>
    </>
  );
}
