import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToastStore, type ToastTone } from '../../stores/toastStore';
import { cn } from '../../utils/cn';

const icons: Record<ToastTone, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
};

const tones: Record<ToastTone, string> = {
  info: 'text-accent',
  success: 'text-success',
  error: 'text-danger',
  warning: 'text-warning',
};

/** Pilha de notificações no canto inferior direito. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => {
        const Icon = icons[t.tone];
        return (
          <div
            key={t.id}
            role="status"
            className="animate-fade-in pointer-events-auto flex gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-xl shadow-black/30"
          >
            <Icon size={18} className={cn('mt-0.5 shrink-0', tones[t.tone])} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-fg">{t.title}</p>
              {t.details && t.details.length > 0 && (
                <ul className="mt-1.5 space-y-1 text-xs text-fg-muted">
                  {t.details.slice(0, 6).map((d) => (
                    <li key={d}>• {d}</li>
                  ))}
                  {t.details.length > 6 && <li>… e mais {t.details.length - 6}</li>}
                </ul>
              )}
            </div>
            <button
              type="button"
              aria-label="Fechar notificação"
              onClick={() => dismiss(t.id)}
              className="shrink-0 self-start text-fg-subtle hover:text-fg"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
