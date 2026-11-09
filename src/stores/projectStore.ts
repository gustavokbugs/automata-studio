import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { emptyDefinition, type EditableAutomaton } from '../core/automata/operations';
import type { ParsedAutomaton } from '../core/automata/serialization';
import type { AutomatonProject, AutomatonType } from '../core/automata/types';
import { createId } from '../utils/id';

/**
 * Estado global dos projetos do usuário, persistido no localStorage.
 *
 * As alterações na definição formal são feitas exclusivamente por meio de
 * `editProject`, que recebe uma operação pura de `core/automata/operations`.
 */
interface ProjectState {
  projects: AutomatonProject[];
  activeId: string | null;

  createProject: (name: string, type: AutomatonType) => string;
  importProject: (parsed: ParsedAutomaton) => string;
  openProject: (id: string | null) => void;
  duplicateProject: (id: string) => string | null;
  deleteProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  setDescription: (id: string, description: string) => void;
  editProject: (id: string, operation: (automaton: EditableAutomaton) => EditableAutomaton) => void;
}

const now = () => new Date().toISOString();

function buildProject(name: string, description: string, automaton: EditableAutomaton): AutomatonProject {
  const timestamp = now();
  return {
    id: createId(),
    name: name.trim() || 'Sem título',
    description,
    definition: structuredClone(automaton.definition),
    layout: structuredClone(automaton.layout),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** Gera um nome ainda não usado: "Nome", "Nome (2)", "Nome (3)"… */
function uniqueName(projects: AutomatonProject[], base: string): string {
  const names = new Set(projects.map((p) => p.name));
  if (!names.has(base)) return base;
  let i = 2;
  while (names.has(`${base} (${i})`)) i++;
  return `${base} (${i})`;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeId: null,

      createProject: (name, type) => {
        const project = buildProject(uniqueName(get().projects, name.trim() || 'Novo autômato'), '', {
          definition: emptyDefinition(type),
          layout: {},
        });
        set((s) => ({ projects: [project, ...s.projects], activeId: project.id }));
        return project.id;
      },

      importProject: (parsed) => {
        const project = buildProject(uniqueName(get().projects, parsed.name), parsed.description, parsed);
        set((s) => ({ projects: [project, ...s.projects], activeId: project.id }));
        return project.id;
      },

      openProject: (id) => set({ activeId: id }),

      duplicateProject: (id) => {
        const source = get().projects.find((p) => p.id === id);
        if (!source) return null;
        const copy = buildProject(uniqueName(get().projects, `${source.name} (cópia)`), source.description, source);
        set((s) => {
          const index = s.projects.findIndex((p) => p.id === id);
          const projects = [...s.projects];
          projects.splice(index + 1, 0, copy);
          return { projects, activeId: copy.id };
        });
        return copy.id;
      },

      deleteProject: (id) =>
        set((s) => {
          const index = s.projects.findIndex((p) => p.id === id);
          const projects = s.projects.filter((p) => p.id !== id);
          const fallback = projects[Math.min(index, projects.length - 1)]?.id ?? null;
          return { projects, activeId: s.activeId === id ? fallback : s.activeId };
        }),

      renameProject: (id, name) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id && name.trim() && name.trim() !== p.name ? { ...p, name: name.trim(), updatedAt: now() } : p,
          ),
        })),

      setDescription: (id, description) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, description, updatedAt: now() } : p)),
        })),

      editProject: (id, operation) =>
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== id) return p;
            const next = operation(p);
            if (next.definition === p.definition && next.layout === p.layout) return p;
            return { ...p, definition: next.definition, layout: next.layout, updatedAt: now() };
          }),
        })),
    }),
    {
      name: 'automata-studio:projects',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ projects: s.projects, activeId: s.activeId }),
    },
  ),
);

/** Seletor do projeto ativo. */
export const selectActiveProject = (s: ProjectState): AutomatonProject | null =>
  s.projects.find((p) => p.id === s.activeId) ?? null;
