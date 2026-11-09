import { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { NewAutomatonDialog } from './components/automata/NewAutomatonDialog';
import { Toaster } from './components/ui/Toaster';
import { EditorPage } from './pages/EditorPage';
import { ExamplesPage } from './pages/ExamplesPage';
import { DocsPage } from './pages/DocsPage';
import { useUiStore } from './stores/uiStore';

/** Raiz da aplicação: layout com barra lateral e a visão corrente. */
export function App() {
  const view = useUiStore((s) => s.view);
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
  }, [theme]);

  return (
    <div className="flex h-full overflow-hidden bg-bg text-fg">
      <Sidebar />
      <main className="min-w-0 flex-1">
        {view === 'editor' && <EditorPage />}
        {view === 'examples' && <ExamplesPage />}
        {view === 'docs' && <DocsPage />}
      </main>
      <NewAutomatonDialog />
      <Toaster />
    </div>
  );
}
