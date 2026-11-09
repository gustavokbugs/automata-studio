import { useCallback } from 'react';
import { parseAutomatonJson, serializeAutomaton } from '../core/automata/serialization';
import { validateAutomaton } from '../core/automata/validation';
import type { AutomatonProject } from '../core/automata/types';
import type { AutomatonExample } from '../data/examples';
import { useProjectStore } from '../stores/projectStore';
import { toast } from '../stores/toastStore';
import { useUiStore } from '../stores/uiStore';
import { downloadTextFile, pickTextFile, slugify } from '../utils/files';

/** Ações de projeto que envolvem arquivos e notificações. */
export function useProjectActions() {
  const importProject = useProjectStore((s) => s.importProject);
  const setView = useUiStore((s) => s.setView);

  const importFromFile = useCallback(async () => {
    const file = await pickTextFile();
    if (!file) return;

    const parsed = parseAutomatonJson(file.text);
    if (!parsed.ok) {
      toast({ tone: 'error', title: `Não foi possível importar "${file.name}"`, details: parsed.errors });
      return;
    }

    importProject(parsed.value);
    setView('editor');

    const errors = validateAutomaton(parsed.value.definition).filter((i) => i.severity === 'error');
    if (errors.length > 0) {
      toast({
        tone: 'warning',
        title: `"${parsed.value.name}" importado com ${errors.length} erro(s) de especificação`,
        details: errors.map((e) => e.message),
      });
    } else {
      toast({ tone: 'success', title: `"${parsed.value.name}" importado com sucesso`, details: parsed.warnings });
    }
  }, [importProject, setView]);

  const exportProject = useCallback((project: AutomatonProject) => {
    const filename = `${slugify(project.name)}.json`;
    downloadTextFile(filename, serializeAutomaton(project));
    toast({ tone: 'success', title: `Especificação exportada como ${filename}` });
  }, []);

  const openExample = useCallback(
    (example: AutomatonExample) => {
      importProject(example);
      setView('editor');
      toast({ tone: 'info', title: `Exemplo "${example.name}" aberto em Meus autômatos` });
    },
    [importProject, setView],
  );

  return { importFromFile, exportProject, openExample };
}
