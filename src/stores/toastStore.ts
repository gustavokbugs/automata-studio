import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'error' | 'warning';

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  details?: string[];
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
}

let counter = 0;

/** Notificações efêmeras (importação, exportação, erros). */
export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...toast, id }] }));
    const timeout = toast.tone === 'error' ? 9000 : 4000;
    window.setTimeout(() => get().dismiss(id), timeout);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Atalho para disparar uma notificação fora de componentes React. */
export const toast = (t: Omit<Toast, 'id'>) => useToastStore.getState().push(t);
