import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { StateName } from '../core/automata/types';

export type View = 'editor' | 'examples' | 'docs';
export type Theme = 'dark' | 'light';
export type InspectorTab = 'config' | 'spec' | 'issues';

/** Elemento selecionado no editor: um estado ou uma aresta (par origem → destino). */
export type Selection = { kind: 'state'; name: StateName } | { kind: 'edge'; from: StateName; to: StateName } | null;

/** Pedido de criação/edição de transições entre dois estados. */
export interface TransitionDraft {
  from: StateName;
  to: StateName;
}

interface UiState {
  view: View;
  theme: Theme;
  sidebarOpen: boolean;
  inspectorTab: InspectorTab;
  selection: Selection;
  transitionDraft: TransitionDraft | null;
  newProjectOpen: boolean;

  setView: (view: View) => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  setInspectorTab: (tab: InspectorTab) => void;
  select: (selection: Selection) => void;
  openTransitionDraft: (draft: TransitionDraft | null) => void;
  setNewProjectOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      view: 'editor',
      theme: 'dark',
      sidebarOpen: false,
      inspectorTab: 'config',
      selection: null,
      transitionDraft: null,
      newProjectOpen: false,

      setView: (view) => set({ view, sidebarOpen: false }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setInspectorTab: (inspectorTab) => set({ inspectorTab }),
      select: (selection) => set({ selection }),
      openTransitionDraft: (transitionDraft) => set({ transitionDraft }),
      setNewProjectOpen: (newProjectOpen) => set({ newProjectOpen }),
    }),
    {
      name: 'automata-studio:ui',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ theme: s.theme, view: s.view }),
    },
  ),
);
